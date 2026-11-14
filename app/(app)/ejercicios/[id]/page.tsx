import Link from "next/link";
import { notFound } from "next/navigation";
import { backLink, shortDate } from "@/app/ui";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Chart } from "./chart";

// Depende de la sesión y de la URL: se permite que la navegación espere al servidor.
export const instant = false;

export default async function ExercisePage({ params }: PageProps<"/ejercicios/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const ex = await db.blockExercise.findFirst({
    where: { id, block: { day: { routine: { userId: user.id } } } },
    include: {
      block: { select: { dayId: true } },
      logs: { orderBy: [{ date: "asc" }, { setNumber: "asc" }] },
    },
  });
  if (!ex) notFound();

  // Una fila por fecha: peso máximo del día y el detalle de las series.
  const sessions = new Map<string, { fecha: string; peso: number; detalle: string[] }>();
  for (const log of ex.logs) {
    const fecha = shortDate(log.date);
    const s = sessions.get(fecha) ?? { fecha, peso: 0, detalle: [] };
    s.peso = Math.max(s.peso, log.weight);
    s.detalle.push(`${log.weight} × ${log.reps}`);
    sessions.set(fecha, s);
  }
  const rows = [...sessions.values()];
  const best = Math.max(0, ...rows.map((r) => r.peso));

  return (
    <main className="mx-auto w-full max-w-3xl p-4 md:p-8">
      <Link href={`/dias/${ex.block.dayId}`} className={backLink}>
        ← Entrenamiento
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">{ex.name}</h1>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Anotá tu primera serie para empezar a ver el progreso.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            Mejor peso: <span className="text-primary">{best} kg</span>
          </p>
          <Card className="mt-4">
            <CardHeader>
              <CardDescription>Peso máximo por entrenamiento</CardDescription>
            </CardHeader>
            <CardContent>
              <Chart data={rows.map(({ fecha, peso }) => ({ fecha, peso }))} />
            </CardContent>
          </Card>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-1 font-normal">Fecha</th>
                <th className="py-1 font-normal">Series (kg × reps)</th>
              </tr>
            </thead>
            <tbody>
              {rows.toReversed().map((r) => (
                <tr key={r.fecha} className="border-t">
                  <td className="py-2">{r.fecha}</td>
                  <td className="py-2">{r.detalle.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
