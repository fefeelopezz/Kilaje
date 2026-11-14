import { CalendarDays, Dumbbell, Flame, Trophy } from "lucide-react";
import Link from "next/link";
import { shortDate } from "@/app/ui";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseDate, today } from "@/lib/sets";
import { summarize } from "@/lib/stats";
import { VolumeChart } from "./volume-chart";

// Depende de la sesión: se permite que la navegación espere al servidor.
export const instant = false;

const kg = (n: number) => `${n.toLocaleString("es-AR")} kg`;

export default async function Dashboard() {
  const user = await requireUser();
  const now = parseDate(today());

  const [logs, routines] = await Promise.all([
    // shortcut: trae las últimas 5000 series; con más historial, pasar los totales a SQL.
    db.setLog.findMany({
      where: { exercise: { block: { day: { routine: { userId: user.id } } } } },
      orderBy: { date: "desc" },
      take: 5000,
      include: { exercise: { select: { name: true, block: { select: { day: { select: { name: true } } } } } } },
    }),
    db.routine.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: { days: { orderBy: { createdAt: "asc" } } },
    }),
  ]);

  const s = summarize(logs, now);
  const names = new Map(logs.map((l) => [l.exerciseId, l.exercise.name]));
  const last = logs[0];
  const lastDays = last
    ? [...new Set(logs.filter((l) => l.date.getTime() === last.date.getTime()).map((l) => l.exercise.block.day.name))]
    : [];

  const metrics = [
    { label: "Entrenamientos esta semana", value: String(s.sessionsThisWeek), icon: Flame },
    { label: "Entrenamientos este mes", value: String(s.sessionsThisMonth), icon: CalendarDays },
    { label: "Series esta semana", value: String(s.setsThisWeek), icon: Dumbbell },
    { label: "Volumen esta semana", value: kg(s.volumeThisWeek), icon: Trophy },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Hola, {user.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {last
          ? `Último entrenamiento: ${shortDate(last.date)}${lastDays.length ? ` · ${lastDays.join(", ")}` : ""}`
          : "Todavía no anotaste ningún entrenamiento."}
      </p>

      <section aria-label="Resumen" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} size="sm">
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs">{m.label}</span>
                <m.icon className="size-4" aria-hidden />
              </div>
              <span className="text-2xl font-semibold tabular-nums">{m.value}</span>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Volumen por semana</CardTitle>
            <CardDescription>Peso × repeticiones de todas tus series, últimas 8 semanas</CardDescription>
          </CardHeader>
          <CardContent>
            <VolumeChart
              data={s.weeklyVolume.map((w) => ({ semana: shortDate(w.start), volumen: w.volumen }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entrenar</CardTitle>
            <CardDescription>Elegí el día que te toca</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {routines.length === 0 && (
              <Link href="/rutinas" className={buttonVariants({ size: "lg" })}>
                Crear tu primera rutina
              </Link>
            )}
            {routines.map((r) => (
              <div key={r.id}>
                <p className="mb-2 text-xs text-muted-foreground">{r.name}</p>
                <div className="flex flex-wrap gap-2">
                  {r.days.map((d) => (
                    <Link key={d.id} href={`/dias/${d.id}`} className={buttonVariants({ variant: "outline", size: "lg" })}>
                      {d.name}
                    </Link>
                  ))}
                  {r.days.length === 0 && (
                    <Link href={`/rutinas/${r.id}`} className="text-sm text-muted-foreground hover:text-foreground">
                      Agregar días →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Récords recientes</CardTitle>
          <CardDescription>Ejercicios donde superaste tu mejor peso en los últimos 14 días</CardDescription>
          <CardAction>
            <Link href="/progreso" className="text-sm text-muted-foreground hover:text-foreground">
              Ver progreso →
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          {s.recentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin récords nuevos por ahora. Cuando superes tu mejor peso en un ejercicio, aparece acá.
            </p>
          ) : (
            <ul className="divide-y divide-white/10">
              {s.recentRecords.map((r) => (
                <li key={r.exerciseId} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/ejercicios/${r.exerciseId}`} className="hover:underline">
                    {names.get(r.exerciseId)}
                  </Link>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {kg(r.previous)} → <span className="text-foreground">{kg(r.weight)}</span> · {shortDate(r.date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
