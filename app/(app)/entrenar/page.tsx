import { Dumbbell } from "lucide-react";
import Link from "next/link";
import { shortDate } from "@/app/ui";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Depende de la sesión: se permite que la navegación espere al servidor.
export const instant = false;

export default async function Train() {
  const user = await requireUser();
  const [routines, last] = await Promise.all([
    db.routine.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: { days: { orderBy: { createdAt: "asc" } } },
    }),
    db.setLog.findFirst({
      where: { exercise: { routine: { userId: user.id } }, dayId: { not: null } },
      orderBy: { date: "desc" },
      select: { dayId: true, date: true, day: { select: { name: true } } },
    }),
  ]);

  // Te toca el día siguiente al último entrenado, en el orden de su rutina (vuelve al primero al final).
  const lastRoutine = routines.find((r) => r.days.some((d) => d.id === last?.dayId)) ?? routines[0];
  const days = lastRoutine?.days ?? [];
  const lastIndex = days.findIndex((d) => d.id === last?.dayId);
  const next = days[(lastIndex + 1) % Math.max(days.length, 1)];

  return (
    <main className="mx-auto w-full max-w-3xl p-4 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Entrenar</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Elegí el día y anotá todas tus series. Se guardan juntas con un solo botón.
      </p>

      {routines.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Todavía no tenés rutinas. Armá una en{" "}
          <Link href="/rutinas" className="underline">
            Editar rutinas
          </Link>
          .
        </p>
      ) : (
        <>
          {next && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Te toca: {next.name}</CardTitle>
                <CardDescription>
                  {last
                    ? `Último entrenamiento: ${last.day?.name ?? "otro día"}, el ${shortDate(last.date)}.`
                    : "Es tu primer entrenamiento. ¡Arrancamos!"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/dias/${next.id}`} className={buttonVariants({ size: "lg", className: "h-12 w-full text-base" })}>
                  <Dumbbell aria-hidden /> Empezar {next.name}
                </Link>
              </CardContent>
            </Card>
          )}

          {routines.map((r) => (
            <section key={r.id} className="mt-6">
              <h2 className="text-sm font-medium text-muted-foreground">{r.name}</h2>
              {r.days.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Sin días todavía.{" "}
                  <Link href={`/rutinas/${r.id}`} className="underline">
                    Agregalos
                  </Link>
                  .
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {r.days.map((d) => (
                    <Link
                      key={d.id}
                      href={`/dias/${d.id}`}
                      className={buttonVariants({ variant: "outline", size: "lg", className: "h-12 text-base" })}
                    >
                      {d.name}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </>
      )}
    </main>
  );
}
