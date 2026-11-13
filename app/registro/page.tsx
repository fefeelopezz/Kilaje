import Link from "next/link";
import { register } from "@/app/actions";
import { backLink } from "@/app/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERRORS: Record<string, string> = {
  "sin-cuenta": "Ese mail todavía no tiene cuenta. Completá tus datos para crearla.",
  datos: "Revisá los datos: nombre, peso entre 20 y 400 kg y un mail válido.",
  envio: "No pudimos enviarte el código. Probá de nuevo en un minuto.",
};

// Depende de la URL: se permite que la navegación espere al servidor.
export const instant = false;

export default async function Register({ searchParams }: PageProps<"/registro">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <main className="mx-auto w-full max-w-sm flex-1 p-4 pt-16">
      <Link href="/login" className={backLink}>
        ← Ingresar
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Crear cuenta</h1>

      <Card className="mt-6">
        <CardContent>
          <form action={register} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" className="h-10" name="name" autoComplete="given-name" maxLength={80} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                className="h-10"
                name="weight"
                inputMode="decimal"
                pattern="[0-9]+([.,][0-9]+)?"
                placeholder="75"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" className="h-10" type="email" name="email" autoComplete="email" required />
              <p className="text-sm text-muted-foreground">
                Te mandamos un código a este mail para confirmar la cuenta.
              </p>
            </div>
            {message && (
              <p role="alert" className="text-sm text-destructive">
                {message}
              </p>
            )}
            <Button type="submit" size="lg" className="h-10">
              Crear cuenta
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
