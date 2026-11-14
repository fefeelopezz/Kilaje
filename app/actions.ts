"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseDate, parseSets } from "@/lib/sets";

function text(fd: FormData, key: string) {
  const v = String(fd.get(key) ?? "").trim().slice(0, 80);
  if (!v) throw new Error(`Falta completar: ${key}`);
  return v;
}

function int(fd: FormData, key: string, min: number, max: number) {
  const n = Number(fd.get(key));
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Valor inválido: ${key}`);
  return n;
}

// Filtros de pertenencia: toda escritura pasa por uno de estos.
const ownDay = (userId: string) => ({ routine: { userId } });
const ownBlock = (userId: string) => ({ day: ownDay(userId) });
const ownExercise = (userId: string) => ({ routine: { userId } });

const refresh = () => revalidatePath("/", "layout");

// --- Login ---

// El mail al que se le mandó el código viaja en una cookie, no en la URL.
const EMAIL_COOKIE = "kilaje_email";

function emailOf(fd: FormData, onError: string) {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(onError);
  return email;
}

async function sendCode(email: string) {
  // No reenvía si ya se mandó un código a ese mail en el último minuto.
  // shortcut: límite solo por mail; sumar límite por IP si aparece abuso.
  const recent = await db.verification.findFirst({
    where: {
      identifier: `sign-in-otp-${email}`,
      createdAt: { gt: new Date(Date.now() - 60_000) },
    },
  });
  if (!recent) await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
  (await cookies()).set(EMAIL_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60,
    path: "/login",
  });
}

export async function requestCode(fd: FormData) {
  const email = emailOf(fd, "/login?error=mail");
  if (!(await db.user.findUnique({ where: { email } }))) redirect("/registro?error=sin-cuenta");
  try {
    await sendCode(email);
  } catch (e) {
    console.error(e);
    redirect("/login?error=envio");
  }
  redirect("/login/codigo");
}

function profileOf(fd: FormData, onError: string) {
  const name = String(fd.get("name") ?? "").trim().slice(0, 80);
  const weight = Number(String(fd.get("weight") ?? "").replace(",", "."));
  if (!name || !(weight >= 20 && weight <= 400)) redirect(onError);
  return { name, weight };
}

export async function updateProfile(fd: FormData) {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: profileOf(fd, "/perfil?error=datos") });
  refresh();
  redirect("/perfil?aviso=guardado");
}

export async function register(fd: FormData) {
  const email = emailOf(fd, "/registro?error=datos");
  const { name, weight } = profileOf(fd, "/registro?error=datos");

  const existing = await db.user.findUnique({ where: { email } });
  if (existing?.emailVerified) redirect("/login?error=ya-registrado");
  // Si el mail quedó a medio registrar (nunca puso el código), se pisan sus datos.
  await db.user.upsert({
    where: { email },
    update: { name, weight },
    create: { id: crypto.randomUUID(), email, name, weight },
  });
  try {
    await sendCode(email);
  } catch (e) {
    console.error(e);
    redirect("/registro?error=envio");
  }
  redirect("/login/codigo");
}

export async function resendCode() {
  const email = (await cookies()).get(EMAIL_COOKIE)?.value;
  if (!email) redirect("/login");
  try {
    await sendCode(email);
  } catch (e) {
    console.error(e);
    redirect("/login?error=envio");
  }
  redirect("/login/codigo?aviso=reenviado");
}

export async function verifyCode(fd: FormData) {
  const jar = await cookies();
  const email = jar.get(EMAIL_COOKIE)?.value;
  if (!email) redirect("/login");
  const otp = String(fd.get("otp") ?? "").replace(/\D/g, "");
  try {
    await auth.api.signInEmailOTP({ body: { email, otp } });
  } catch {
    redirect("/login/codigo?error=codigo");
  }
  jar.delete({ name: EMAIL_COOKIE, path: "/login" });
  redirect("/");
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

// --- Rutinas ---

export async function createRoutine(fd: FormData) {
  const user = await requireUser();
  const routine = await db.routine.create({
    data: { userId: user.id, name: text(fd, "name") },
  });
  redirect(`/rutinas/${routine.id}`);
}

export async function deleteRoutine(id: string) {
  const user = await requireUser();
  await db.routine.delete({ where: { id, userId: user.id } });
  redirect("/rutinas");
}

export async function createDay(routineId: string, fd: FormData) {
  const user = await requireUser();
  await db.routine.update({
    where: { id: routineId, userId: user.id },
    data: { days: { create: { name: text(fd, "name") } } },
  });
  refresh();
}

export async function deleteDay(id: string) {
  const user = await requireUser();
  await db.day.delete({ where: { id, ...ownDay(user.id) } });
  refresh();
}

// Ejercicios elegidos en el formulario (checkbox o select "ej") que son de la rutina del día.
async function chosenExercises(fd: FormData, routineId: string) {
  const ids = fd.getAll("ej").map(String).slice(0, 50);
  const found = await db.exercise.findMany({ where: { id: { in: ids }, routineId }, select: { id: true } });
  return found.map((e) => ({ exerciseId: e.id }));
}

export async function createBlock(dayId: string, fd: FormData) {
  const user = await requireUser();
  const day = await db.day.findFirstOrThrow({ where: { id: dayId, ...ownDay(user.id) } });
  await db.block.create({
    data: {
      dayId,
      name: text(fd, "name"),
      exercises: { create: await chosenExercises(fd, day.routineId) },
    },
  });
  refresh();
}

export async function addToBlock(blockId: string, fd: FormData) {
  const user = await requireUser();
  const block = await db.block.findFirstOrThrow({
    where: { id: blockId, ...ownBlock(user.id) },
    include: { day: { select: { routineId: true } } },
  });
  const chosen = await chosenExercises(fd, block.day.routineId);
  await db.blockExercise.createMany({
    data: chosen.map((c) => ({ ...c, blockId })),
    skipDuplicates: true,
  });
  refresh();
}

export async function removeFromBlock(id: string) {
  const user = await requireUser();
  await db.blockExercise.delete({ where: { id, block: ownBlock(user.id) } });
  refresh();
}

export async function deleteBlock(id: string) {
  const user = await requireUser();
  await db.block.delete({ where: { id, ...ownBlock(user.id) } });
  refresh();
}

export async function createExercise(routineId: string, fd: FormData) {
  const user = await requireUser();
  const data = { name: text(fd, "name"), sets: int(fd, "sets", 1, 20), reps: int(fd, "reps", 1, 100) };
  const routine = await db.routine.findFirstOrThrow({ where: { id: routineId, userId: user.id } });
  const repeated = await db.exercise.findUnique({
    where: { routineId_name: { routineId: routine.id, name: data.name } },
  });
  if (repeated) redirect(`/rutinas/${routineId}?error=repetido`);
  await db.exercise.create({ data: { ...data, routineId: routine.id } });
  refresh();
  redirect(`/rutinas/${routineId}`);
}

export async function deleteExercise(id: string) {
  const user = await requireUser();
  await db.exercise.delete({ where: { id, ...ownExercise(user.id) } });
  refresh();
}

// --- Series ---

// Reemplaza las series de ese ejercicio en esa fecha por las del formulario.
export async function saveSets(exerciseId: string, dayId: string, fd: FormData) {
  const user = await requireUser();
  const date = parseDate(fd.get("date"));
  const exercise = await db.exercise.findFirstOrThrow({
    where: { id: exerciseId, ...ownExercise(user.id) },
  });
  // El día tiene que ser de la misma rutina que el ejercicio.
  await db.day.findFirstOrThrow({ where: { id: dayId, routineId: exercise.routineId } });
  const sets = parseSets((key) => fd.get(key), exercise.sets);
  await db.$transaction([
    db.setLog.deleteMany({ where: { exerciseId, date } }),
    db.setLog.createMany({ data: sets.map((s) => ({ ...s, exerciseId, dayId, date })) }),
  ]);
  refresh();
}
