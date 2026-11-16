import Link from "next/link";
import { createRoutine } from "@/app/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Depende de la sesión y de la URL: se permite que la navegación espere al servidor.
export const instant = false;

export default async function Routines() {
  const user = await requireUser();
  const routines = await db.routine.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { days: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <main className="mx-auto w-full max-w-3xl p-4 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Editar rutinas</h1>
      <p className="mt-1 text-sm text-muted-foreground">Armá y cambiá tus rutinas: ejercicios, días y bloques. Para anotar pesos, andá a Entrenar.</p>

      {routines.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Armá tu primera rutina: ponele un nombre y después sumale días, bloques y ejercicios.
        </p>
      )}

      {routines.map((routine) => (
        <Card key={routine.id} className="mt-4">
          <CardHeader>
            <CardTitle>{routine.name}</CardTitle>
            <CardAction>
              <Link
                href={`/rutinas/${routine.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Editar
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {routine.days.map((day) => (
              <span key={day.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
                {day.name}
              </span>
            ))}
            {routine.days.length === 0 && (
              <span className="text-sm text-muted-foreground">Todavía sin días.</span>
            )}
          </CardContent>
        </Card>
      ))}

      <form action={createRoutine} className="mt-6 flex gap-2">
        <Input
          className="h-9 flex-1"
          name="name"
          placeholder="Push Pull Legs"
          aria-label="Nombre de la rutina nueva"
          maxLength={80}
          required
        />
        <Button type="submit" size="lg">
          Crear rutina
        </Button>
      </form>
    </main>
  );
}
