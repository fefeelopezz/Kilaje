import Link from "next/link";
import { shortDate } from "@/app/ui";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Depende de la sesión: se permite que la navegación espere al servidor.
export const instant = false;

export default async function Progress() {
  const user = await requireUser();
  // Solo series efectivas: las de aproximación no cuentan para el mejor peso.
  const own = { exercise: { routine: { userId: user.id } }, warmup: false };
  const [exercises, best, recent] = await Promise.all([
    db.exercise.findMany({
      where: { routine: { userId: user.id } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        routine: { select: { name: true } },
        blocks: { select: { block: { select: { day: { select: { name: true } } } } } },
      },
    }),
    db.setLog.groupBy({
      by: ["exerciseId"],
      where: own,
      _max: { weight: true, date: true },
      _count: true,
    }),
    // shortcut: "última vez" sale de las 2000 series más recientes; con más historial, pasarlo a SQL.
    db.setLog.findMany({ where: own, orderBy: { date: "desc" }, take: 2000 }),
  ]);
  const stats = new Map(best.map((b) => [b.exerciseId, b]));
  // Peso máximo en la última fecha de cada ejercicio.
  const lastWeight = new Map<string, { date: number; weight: number }>();
  for (const l of recent) {
    const cur = lastWeight.get(l.exerciseId);
    if (!cur) lastWeight.set(l.exerciseId, { date: l.date.getTime(), weight: l.weight });
    else if (cur.date === l.date.getTime()) cur.weight = Math.max(cur.weight, l.weight);
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Progreso</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tu mejor peso en cada ejercicio. Tocá uno para ver el gráfico.</p>

      {exercises.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Todavía no tenés ejercicios. Agregalos en <Link href="/rutinas" className="underline">Rutinas</Link>.
        </p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exercises.map((ex) => {
            const st = stats.get(ex.id);
            const lw = lastWeight.get(ex.id);
            return (
              <Link key={ex.id} href={`/ejercicios/${ex.id}`} className="group">
                <Card size="sm" className="h-full transition-colors group-hover:ring-white/25">
                  <CardContent className="flex flex-col gap-1">
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {[ex.routine.name, ...new Set(ex.blocks.map((b) => b.block.day.name))].join(" · ")}
                    </span>
                    {st?._max.weight != null ? (
                      <div className="mt-2 flex items-end justify-between gap-2">
                        <span className="text-2xl font-semibold tabular-nums">{st._max.weight} kg</span>
                        <span className="text-right text-xs text-muted-foreground">
                          {lw && <>Última vez: {lw.weight} kg</>}
                          {st._max.date && <> · {shortDate(st._max.date)}</>}
                          <br />
                          {st._count} series anotadas
                        </span>
                      </div>
                    ) : (
                      <span className="mt-2 text-sm text-muted-foreground">Sin series anotadas</span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
