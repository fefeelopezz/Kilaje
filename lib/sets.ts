export type SetInput = { setNumber: number; weight: number; reps: number; warmup: boolean };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDate(value: unknown): Date {
  const d = new Date(`${value}T00:00:00Z`);
  if (typeof value !== "string" || !DATE.test(value) || isNaN(d.getTime()))
    throw new Error("Fecha inválida");
  return d;
}

// Lee los campos peso-N / reps-N / aprox-N del formulario. Una serie sin peso se ignora.
export function parseSets(get: (key: string) => unknown, count: number): SetInput[] {
  const out: SetInput[] = [];
  for (let n = 1; n <= count; n++) {
    const raw = String(get(`peso-${n}`) ?? "").trim().replace(",", ".");
    if (!raw) continue;
    const weight = Number(raw);
    const reps = Number(get(`reps-${n}`));
    if (!(weight >= 0 && weight <= 2000)) throw new Error(`Peso inválido en la serie ${n}`);
    if (!(Number.isInteger(reps) && reps >= 1 && reps <= 1000))
      throw new Error(`Repeticiones inválidas en la serie ${n}`);
    out.push({ setNumber: n, weight, reps, warmup: get(`aprox-${n}`) != null });
  }
  return out;
}

// De una lista ordenada por fecha descendente, deja solo la fecha más reciente de cada ejercicio.
export function latestPerExercise<T extends { exerciseId: string; date: Date }>(logs: T[]) {
  const out = new Map<string, T[]>();
  for (const log of logs) {
    const kept = out.get(log.exerciseId);
    if (!kept) out.set(log.exerciseId, [log]);
    else if (kept[0].date.getTime() === log.date.getTime()) kept.push(log);
  }
  return out;
}

// Hoy en la zona horaria de la app, como AAAA-MM-DD.
// shortcut: una sola zona para todos los usuarios; pasar a zona por usuario si se usa desde otros países.
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TZ ?? "America/Argentina/Buenos_Aires",
  }).format(new Date());
}
