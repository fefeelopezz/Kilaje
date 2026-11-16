import Link from "next/link";
import { notFound } from "next/navigation";
import { saveWorkout } from "@/app/actions";
import { backLink, shortDate, ToggleChip } from "@/app/ui";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { latestPerExercise, parseDate, today } from "@/lib/sets";

const byCreation = { orderBy: { createdAt: "asc" } } as const;

// Depende de la sesión y de la URL: se permite que la navegación espere al servidor.
export const instant = false;

export default async function DayPage({ params, searchParams }: PageProps<"/dias/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { fecha: asked, aviso } = await searchParams;

  let date: Date;
  try {
    date = parseDate(asked);
  } catch {
    date = parseDate(today());
  }
  const fecha = date.toISOString().slice(0, 10);

  const day = await db.day.findFirst({
    where: { id, routine: { userId: user.id } },
    include: {
      blocks: { ...byCreation, include: { exercises: { ...byCreation, include: { exercise: true } } } },
    },
  });
  if (!day) notFound();

  const ids = day.blocks.flatMap((b) => b.exercises.map((be) => be.exerciseId));
  const [current, previous] = await Promise.all([
    db.setLog.findMany({ where: { exerciseId: { in: ids }, date } }),
    // shortcut: mira solo las 500 series anteriores más recientes del día;
    // pasar a una consulta por ejercicio si "última vez" empieza a faltar.
    db.setLog.findMany({
      where: { exerciseId: { in: ids }, date: { lt: date } },
      orderBy: [{ date: "desc" }, { setNumber: "asc" }],
      take: 500,
    }),
  ]);
  const last = latestPerExercise(previous);
  const seen = new Set<string>();

  return (
    <main className="mx-auto w-full max-w-3xl p-4 md:p-8">
      <Link href="/entrenar" className={backLink}>
        ← Entrenar
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{day.name}</h1>

      <form className="mt-3 flex items-center gap-2">
        <Input className="h-9 w-auto" type="date" name="fecha" defaultValue={fecha} aria-label="Fecha" />
        <Button type="submit" variant="outline" size="lg">
          Cambiar fecha
        </Button>
      </form>

      {aviso === "guardado" && (
        <p role="status" className="mt-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
          Entrenamiento guardado.
        </p>
      )}

      {/* Un solo formulario: todas las series del día se guardan juntas. */}
      <form action={saveWorkout.bind(null, day.id)}>
        <input type="hidden" name="date" value={fecha} />
        {ids.length > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            Marcá &quot;Aprox.&quot; en las series de aproximación: no cuentan para récords ni volumen.
          </p>
        )}
      {day.blocks.map((block) => (
        <section key={block.id} className="mt-6">
          <h2 className="font-medium text-primary">{block.name}</h2>
          {block.exercises.map(({ id: entryId, exercise: ex }) => {
            // Si el ejercicio ya apareció en otro bloque del día, se anota una sola vez.
            if (seen.has(ex.id)) return null;
            seen.add(ex.id);
            const mine = current.filter((l) => l.exerciseId === ex.id);
            const prev = last.get(ex.id);
            return (
              <Card key={`${entryId}-${fecha}`} className="mt-3">
                <CardHeader>
                  <CardTitle>
                    <Link href={`/ejercicios/${ex.id}`} className="hover:text-primary">
                      {ex.name}
                    </Link>
                  </CardTitle>
                  <CardAction className="text-sm text-muted-foreground">
                    {ex.sets} × {ex.reps}
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    {prev && (
                      <p className="text-sm text-muted-foreground">
                        Última vez ({shortDate(prev[0].date)}):{" "}
                        {prev.map((l) => `${l.weight} kg × ${l.reps}${l.warmup ? " (aprox.)" : ""}`).join(" · ")}
                      </p>
                    )}
                    {Array.from({ length: ex.sets }, (_, i) => {
                      const n = i + 1;
                      const cur = mine.find((l) => l.setNumber === n);
                      const before = prev?.find((l) => l.setNumber === n);
                      return (
                        <div key={n} className="flex flex-wrap items-center gap-2">
                          <span className="w-14 text-sm text-muted-foreground">Serie {n}</span>
                          <Input
                            className="h-10 w-24"
                            name={`${ex.id}:peso-${n}`}
                            inputMode="decimal"
                            pattern="[0-9]+([.,][0-9]+)?"
                            placeholder={before ? String(before.weight) : "0"}
                            defaultValue={cur?.weight ?? ""}
                            aria-label={`Peso en kg, serie ${n} de ${ex.name}`}
                          />
                          <span className="text-sm text-muted-foreground">kg ×</span>
                          <Input
                            className="h-10 w-20"
                            name={`${ex.id}:reps-${n}`}
                            type="number"
                            min={1}
                            max={1000}
                            defaultValue={cur?.reps ?? ex.reps}
                            aria-label={`Repeticiones, serie ${n} de ${ex.name}`}
                            required
                          />
                          <ToggleChip
                            name={`${ex.id}:aprox-${n}`}
                            label="Aprox."
                            defaultChecked={cur?.warmup ?? before?.warmup}
                            ariaLabel={`Serie ${n} de ${ex.name} es de aproximación`}
                          />
                        </div>
                      );
                    })}
                    {mine.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {mine.length} de {ex.sets} series anotadas
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ))}
        {ids.length > 0 && (
          // Fijo abajo (sobre el menú del celular) para guardar sin volver a subir.
          <div className="sticky bottom-20 z-10 mt-6 md:bottom-4">
            <Button type="submit" size="lg" className="h-12 w-full text-base shadow-lg">
              Guardar entrenamiento
            </Button>
          </div>
        )}
      </form>

      {ids.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Este día todavía no tiene ejercicios. Agregalos desde la rutina.
        </p>
      )}
    </main>
  );
}
