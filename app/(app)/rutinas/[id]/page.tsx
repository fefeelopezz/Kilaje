import Link from "next/link";
import { notFound } from "next/navigation";
import {
  createBlock,
  createDay,
  createExercise,
  deleteBlock,
  deleteDay,
  deleteExercise,
  deleteRoutine,
} from "@/app/actions";
import { backLink, DeleteForm } from "@/app/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const byCreation = { orderBy: { createdAt: "asc" } } as const;

// Depende de la sesión y de la URL: se permite que la navegación espere al servidor.
export const instant = false;

export default async function RoutinePage({ params }: PageProps<"/rutinas/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const routine = await db.routine.findFirst({
    where: { id, userId: user.id },
    include: {
      days: {
        ...byCreation,
        include: { blocks: { ...byCreation, include: { exercises: byCreation } } },
      },
    },
  });
  if (!routine) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl p-4 md:p-8">
      <Link href="/" className={backLink}>
        ← Rutinas
      </Link>
      <div className="mt-2 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold">{routine.name}</h1>
        <DeleteForm action={deleteRoutine.bind(null, routine.id)} what="la rutina" />
      </div>

      {routine.days.map((day) => (
        <Card key={day.id} className="mt-4">
          <CardHeader>
            <CardTitle>{day.name}</CardTitle>
            <CardAction>
              <DeleteForm action={deleteDay.bind(null, day.id)} what="el día" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <Link href={`/dias/${day.id}`} className={buttonVariants({ size: "lg" })}>
              Entrenar
            </Link>

            {day.blocks.map((block) => (
              <div key={block.id} className="mt-4 border-t pt-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-primary">{block.name}</h3>
                  <DeleteForm action={deleteBlock.bind(null, block.id)} what="el bloque" />
                </div>
                <ul className="mt-2 flex flex-col gap-2">
                  {block.exercises.map((ex) => (
                    <li key={ex.id} className="flex items-start justify-between gap-3">
                      <Link href={`/ejercicios/${ex.id}`} className="hover:text-primary">
                        {ex.name}{" "}
                        <span className="text-sm text-muted-foreground">
                          {ex.sets} × {ex.reps}
                        </span>
                      </Link>
                      <DeleteForm action={deleteExercise.bind(null, ex.id)} what="el ejercicio" />
                    </li>
                  ))}
                </ul>
                <form
                  action={createExercise.bind(null, block.id)}
                  className="mt-3 flex flex-wrap items-center gap-2"
                >
                  <Input
                    className="h-9 flex-1 basis-40"
                    name="name"
                    placeholder="Press banca"
                    aria-label={`Ejercicio nuevo en ${block.name}`}
                    maxLength={80}
                    required
                  />
                  <Input
                    className="h-9 w-16"
                    name="sets"
                    type="number"
                    min={1}
                    max={20}
                    defaultValue={4}
                    aria-label="Series"
                    required
                  />
                  <span className="text-sm text-muted-foreground">×</span>
                  <Input
                    className="h-9 w-16"
                    name="reps"
                    type="number"
                    min={1}
                    max={100}
                    defaultValue={8}
                    aria-label="Repeticiones"
                    required
                  />
                  <Button type="submit" variant="outline" size="lg">
                    Agregar ejercicio
                  </Button>
                </form>
              </div>
            ))}

            <form action={createBlock.bind(null, day.id)} className="mt-4 flex gap-2 border-t pt-3">
              <Input
                className="h-9 flex-1"
                name="name"
                placeholder="Pecho"
                aria-label={`Bloque nuevo en ${day.name}`}
                maxLength={80}
                required
              />
              <Button type="submit" variant="outline" size="lg">
                Agregar bloque
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}

      <form action={createDay.bind(null, routine.id)} className="mt-4 flex gap-2">
        <Input
          className="h-9 flex-1"
          name="name"
          placeholder="Lunes"
          aria-label="Día nuevo"
          maxLength={80}
          required
        />
        <Button type="submit" size="lg">
          Agregar día
        </Button>
      </form>
    </main>
  );
}
