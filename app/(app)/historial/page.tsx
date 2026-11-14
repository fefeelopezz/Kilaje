import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Depende de la sesión: se permite que la navegación espere al servidor.
export const instant = false;

const longDate = (d: Date) =>
  d.toLocaleDateString("es-AR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });

export default async function HistoryPage() {
  const user = await requireUser();
  // shortcut: muestra las últimas 2000 series; paginar si el historial crece mucho.
  const logs = await db.setLog.findMany({
    where: { exercise: { block: { day: { routine: { userId: user.id } } } } },
    orderBy: [{ date: "desc" }, { setNumber: "asc" }],
    take: 2000,
    include: { exercise: { select: { name: true, block: { select: { day: { select: { id: true, name: true } } } } } } },
  });

  // Una entrada por fecha y día de rutina, con el peso máximo de cada ejercicio hecho.
  const sessions = new Map<
    string,
    { date: Date; dayId: string; day: string; sets: number; volume: number; exercises: Map<string, number> }
  >();
  for (const l of logs) {
    const day = l.exercise.block.day;
    const key = `${l.date.toISOString()}|${day.id}`;
    const s = sessions.get(key) ?? { date: l.date, dayId: day.id, day: day.name, sets: 0, volume: 0, exercises: new Map() };
    s.sets++;
    s.volume += l.weight * l.reps;
    s.exercises.set(l.exercise.name, Math.max(s.exercises.get(l.exercise.name) ?? 0, l.weight));
    sessions.set(key, s);
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-4 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Historial</h1>
      <p className="mt-1 text-sm text-muted-foreground">Cada entrenamiento que anotaste, del más reciente al más viejo.</p>

      {sessions.size === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Todavía no hay entrenamientos. Anotá tus series desde <Link href="/rutinas" className="underline">Rutinas</Link>.
        </p>
      ) : (
        <ol className="mt-6 flex flex-col gap-3">
          {[...sessions.values()].map((s) => {
            const fecha = s.date.toISOString().slice(0, 10);
            return (
              <li key={`${fecha}-${s.dayId}`}>
                <Card size="sm">
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link href={`/dias/${s.dayId}?fecha=${fecha}`} className="font-medium first-letter:uppercase hover:underline">
                        {longDate(s.date)} · {s.day}
                      </Link>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {s.sets} {s.sets === 1 ? "serie" : "series"} ·{Math.round(s.volume).toLocaleString("es-AR")} kg de volumen
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {[...s.exercises].map(([name, w]) => `${name} ${w} kg`).join(" · ")}
                    </p>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
