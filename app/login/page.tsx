import Link from "next/link";
import { requestCode } from "@/app/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERRORS: Record<string, string> = {
  mail: "Revisá el mail: no parece válido.",
  envio: "No pudimos enviarte el código. Probá de nuevo en un minuto.",
  "ya-registrado": "Ese mail ya tiene cuenta. Pedí tu código para entrar.",
};

// Depende de la sesión y de la URL: se permite que la navegación espere al servidor.
export const instant = false;

export default async function Login({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <main className="mx-auto w-full max-w-sm flex-1 p-4 pt-16">
      <h1 className="text-3xl font-semibold">
        Kila<span className="text-primary">je</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Tu rutina y tus pesos, serie por serie.</p>

      <Card className="mt-6">
        <CardContent>
          <form action={requestCode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" className="h-10" type="email" name="email" autoComplete="email" required />
              <p className="text-sm text-muted-foreground">
                Te mandamos un código de 6 dígitos para entrar. Sin contraseña.
              </p>
            </div>
            {message && (
              <p role="alert" className="text-sm text-destructive">
                {message}
              </p>
            )}
            <Button type="submit" size="lg" className="h-10">
              Enviarme el código
            </Button>
            <Link href="/registro" className={buttonVariants({ variant: "outline", size: "lg", className: "h-10" })}>
              Crear cuenta
            </Link>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
