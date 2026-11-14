import { X } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addToBlock,
  createBlock,
  createDay,
  createExercise,
  deleteBlock,
  deleteDay,
  deleteExercise,
  deleteRoutine,
  removeFromBlock,
} from "@/app/actions";
import { backLink, DeleteForm, ToggleChip } from "@/app/ui";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const byCreation = { orderBy: { createdAt: "asc" } } as const;
const select =
  "h-9 min-w-0 flex-1 rounded-lg border border-input bg-black px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// Depende de la sesión y de la URL: se permite que la navegación espere al servidor.
export const instant = false;

export default async function RoutinePage({ params, searchParams }: PageProps<"/rutinas/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;
  const routine = await db.routine.findFirst({
    where: { id, userId: user.id },
    include: {
      exercises: byCreation,
      days: {
        ...byCreation,
        include: {
          blocks: { ...byCreation, include: { exercises: { ...byCreation, include: { exercise: true } } } },
        },
      },
    },
  });
  if (!routine) notFound();
  const pool = routine.exercises;

  return (
    <main className="mx-auto w-full max-w-3xl p-4 md:p-8">
      <Link href="/rutinas" className={backLink}>
        ← Rutinas
      </Link>
      <div className="mt-2 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{routine.name}</h1>
        <DeleteForm action={deleteRoutine.bind(null, routine.id)} what="la rutina" />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>1. Ejercicios</CardTitle>
          <CardDescription>Cargá todos los ejercicios de la rutina. Después los repartís en bloques.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {pool.length > 0 && (
            <ul className="divide-y divide-white/10">
              {pool.map((ex) => (
                <li key={ex.id} className="flex items-start justify-between gap-3 py-2">
                  <Link href={`/ejercicios/${ex.id}`} className="hover:underline">
                    {ex.name}{" "}
                    <span className="text-sm text-muted-foreground">
                      {ex.sets} × {ex.reps}
                    </span>
                  </Link>
                  <DeleteForm action={deleteExercise.bind(null, ex.id)} what="el ejercicio y sus series" />
                </li>
              ))}
            </ul>
          )}
          <form action={createExercise.bind(null, routine.id)} className="flex flex-wrap items-center gap-2">
            <Input
              className="h-9 flex-1 basis-40"
              name="name"
              placeholder="Press banca"
              aria-label="Ejercicio nuevo"
              maxLength={80}
              required
            />
            <Input className="h-9 w-16" name="sets" type="number" min={1} max={20} defaultValue={4} aria-label="Series" required />
            <span className="text-sm text-muted-foreground">×</span>
            <Input className="h-9 w-16" name="reps" type="number" min={1} max={100} defaultValue={8} aria-label="Repeticiones" required />
            <Button type="submit" size="lg">
              Agregar ejercicio
            </Button>
          </form>
          {error === "repetido" && (
            <p role="alert" className="text-sm text-destructive">
              Ya tenés un ejercicio con ese nombre en esta rutina.
            </p>
          )}
        </CardContent>
      </Card>

      <h2 className="mt-8 text-lg font-semibold">2. Días y bloques</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Armá cada día con bloques y elegí qué ejercicios van en cada uno.
      </p>

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

            {day.blocks.map((block) => {
              const inBlock = new Set(block.exercises.map((be) => be.exerciseId));
              const missing = pool.filter((ex) => !inBlock.has(ex.id));
              return (
                <div key={block.id} className="mt-4 border-t pt-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium">{block.name}</h3>
                    <DeleteForm action={deleteBlock.bind(null, block.id)} what="el bloque" />
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {block.exercises.map((be) => (
                      <li
                        key={be.id}
                        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 py-1 pr-1 pl-3 text-sm"
                      >
                        {be.exercise.name}
                        <span className="text-muted-foreground">
                          {be.exercise.sets}×{be.exercise.reps}
                        </span>
                        <form action={removeFromBlock.bind(null, be.id)}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Sacar ${be.exercise.name} de ${block.name}`}
                          >
                            <X />
                          </Button>
                        </form>
                      </li>
                    ))}
                    {block.exercises.length === 0 && (
                      <li className="text-sm text-muted-foreground">Sin ejercicios todavía.</li>
                    )}
                  </ul>
                  {missing.length > 0 && (
                    <form action={addToBlock.bind(null, block.id)} className="mt-3 flex gap-2">
                      <select name="ej" className={select} aria-label={`Ejercicio para agregar a ${block.name}`} required>
                        {missing.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" variant="outline" size="lg">
                        Agregar
                      </Button>
                    </form>
                  )}
                </div>
              );
            })}

            <form action={createBlock.bind(null, day.id)} className="mt-4 flex flex-col gap-3 border-t pt-3">
              <p className="text-sm font-medium">Nuevo bloque</p>
              <Input
                className="h-9"
                name="name"
                placeholder="Pecho"
                aria-label={`Nombre del bloque nuevo en ${day.name}`}
                maxLength={80}
                required
              />
              {pool.length === 0 ? (
                <p className="text-sm text-muted-foreground">Primero cargá ejercicios en el paso 1 para elegirlos acá.</p>
              ) : (
                <fieldset>
                  <legend className="mb-2 text-sm text-muted-foreground">Elegí los ejercicios del bloque</legend>
                  <div className="flex flex-wrap gap-2">
                    {pool.map((ex) => (
                      <ToggleChip key={ex.id} name="ej" value={ex.id} label={ex.name} />
                    ))}
                  </div>
                </fieldset>
              )}
              <Button type="submit" variant="outline" size="lg" className="self-start">
                Crear bloque
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}

      <form action={createDay.bind(null, routine.id)} className="mt-4 flex gap-2">
        <Input className="h-9 flex-1" name="name" placeholder="Lunes" aria-label="Día nuevo" maxLength={80} required />
        <Button type="submit" size="lg">
          Agregar día
        </Button>
      </form>
    </main>
  );
}
