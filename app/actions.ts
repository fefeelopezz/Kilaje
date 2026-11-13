"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
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
const ownExercise = (userId: string) => ({ block: ownBlock(userId) });

const refresh = () => revalidatePath("/", "layout");

// --- Login ---

async function enter(fd: FormData, isNew: boolean) {
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  try {
    if (isNew)
      await auth.api.signUpEmail({ body: { email, password, name: email.split("@")[0] } });
    else await auth.api.signInEmail({ body: { email, password } });
  } catch {
    redirect(`/login?error=${isNew ? "registro" : "ingreso"}`);
  }
  redirect("/");
}

export async function signIn(fd: FormData) {
  await enter(fd, false);
}

export async function signUp(fd: FormData) {
  await enter(fd, true);
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
  redirect("/");
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

export async function createBlock(dayId: string, fd: FormData) {
  const user = await requireUser();
  await db.day.update({
    where: { id: dayId, ...ownDay(user.id) },
    data: { blocks: { create: { name: text(fd, "name") } } },
  });
  refresh();
}

export async function deleteBlock(id: string) {
  const user = await requireUser();
  await db.block.delete({ where: { id, ...ownBlock(user.id) } });
  refresh();
}

export async function createExercise(blockId: string, fd: FormData) {
  const user = await requireUser();
  await db.block.update({
    where: { id: blockId, ...ownBlock(user.id) },
    data: {
      exercises: {
        create: {
          name: text(fd, "name"),
          sets: int(fd, "sets", 1, 20),
          reps: int(fd, "reps", 1, 100),
        },
      },
    },
  });
  refresh();
}

export async function deleteExercise(id: string) {
  const user = await requireUser();
  await db.blockExercise.delete({ where: { id, ...ownExercise(user.id) } });
  refresh();
}

// --- Series ---

// Reemplaza las series de ese ejercicio en esa fecha por las del formulario.
export async function saveSets(exerciseId: string, fd: FormData) {
  const user = await requireUser();
  const date = parseDate(fd.get("date"));
  const exercise = await db.blockExercise.findFirstOrThrow({
    where: { id: exerciseId, ...ownExercise(user.id) },
  });
  const sets = parseSets((key) => fd.get(key), exercise.sets);
  await db.$transaction([
    db.setLog.deleteMany({ where: { exerciseId, date } }),
    db.setLog.createMany({ data: sets.map((s) => ({ ...s, exerciseId, date })) }),
  ]);
  refresh();
}
