import Link from "next/link";
import { notFound } from "next/navigation";
import { saveSets } from "@/app/actions";
import { backLink, shortDate } from "@/app/ui";
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
  const { fecha: asked } = await searchParams;

  let date: Date;
  try {
    date = parseDate(asked);
  } catch {
    date = parseDate(today());
  }
  const fecha = date.toISOString().slice(0, 10);

  const day = await db.day.findFirst({
    where: { id, routine: { userId: user.id } },
    include: { blocks: { ...byCreation, include: { exercises: byCreation } } },
  });
  if (!day) notFound();

  const ids = day.blocks.flatMap((b) => b.exercises.map((e) => e.id));
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

  return (
    <main className="mx-auto w-full max-w-3xl p-4 md:p-8">
      <Link href={`/rutinas/${day.routineId}`} className={backLink}>
        ← Rutina
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{day.name}</h1>

      <form className="mt-3 flex items-center gap-2">
        <Input className="h-9 w-auto" type="date" name="fecha" defaultValue={fecha} aria-label="Fecha" />
        <Button type="submit" variant="outline" size="lg">
          Cambiar fecha
        </Button>
      </form>

      {day.blocks.map((block) => (
        <section key={block.id} className="mt-6">
          <h2 className="font-medium text-primary">{block.name}</h2>
          {block.exercises.map((ex) => {
            const mine = current.filter((l) => l.exerciseId === ex.id);
            const prev = last.get(ex.id);
            return (
              <Card key={`${ex.id}-${fecha}`} className="mt-3">
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
                  <form action={saveSets.bind(null, ex.id)} className="flex flex-col gap-2">
                    <input type="hidden" name="date" value={fecha} />
                    {prev && (
                      <p className="text-sm text-muted-foreground">
                        Última vez ({shortDate(prev[0].date)}):{" "}
                        {prev.map((l) => `${l.weight} kg × ${l.reps}`).join(" · ")}
                      </p>
                    )}
                    {Array.from({ length: ex.sets }, (_, i) => {
                      const n = i + 1;
                      const cur = mine.find((l) => l.setNumber === n);
                      const before = prev?.find((l) => l.setNumber === n);
                      return (
                        <div key={n} className="flex items-center gap-2">
                          <span className="w-14 text-sm text-muted-foreground">Serie {n}</span>
                          <Input
                            className="h-10 w-24"
                            name={`peso-${n}`}
                            inputMode="decimal"
                            pattern="[0-9]+([.,][0-9]+)?"
                            placeholder={before ? String(before.weight) : "0"}
                            defaultValue={cur?.weight ?? ""}
                            aria-label={`Peso en kg, serie ${n} de ${ex.name}`}
                          />
                          <span className="text-sm text-muted-foreground">kg ×</span>
                          <Input
                            className="h-10 w-20"
                            name={`reps-${n}`}
                            type="number"
                            min={1}
                            max={1000}
                            defaultValue={cur?.reps ?? ex.reps}
                            aria-label={`Repeticiones, serie ${n} de ${ex.name}`}
                            required
                          />
                        </div>
                      );
                    })}
                    <div className="mt-1 flex items-center gap-3">
                      <Button type="submit" size="lg" className="h-10 px-4">
                        Guardar
                      </Button>
                      {mine.length > 0 && (
                        <span className="text-sm text-primary">
                          {mine.length} de {ex.sets} series anotadas
                        </span>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </section>
      ))}

      {ids.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Este día todavía no tiene ejercicios. Agregalos desde la rutina.
        </p>
      )}
    </main>
  );
}
