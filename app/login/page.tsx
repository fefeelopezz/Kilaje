import { signIn, signUp } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERRORS: Record<string, string> = {
  ingreso: "Email o contraseña incorrectos.",
  registro:
    "No se pudo crear la cuenta. Revisá que el email no esté ya registrado y que la contraseña tenga al menos 8 caracteres.",
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
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" className="h-10" type="email" name="email" autoComplete="email" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                className="h-10"
                type="password"
                name="password"
                autoComplete="current-password"
                minLength={8}
                required
              />
            </div>
            {message && (
              <p role="alert" className="text-sm text-destructive">
                {message}
              </p>
            )}
            <Button type="submit" size="lg" className="h-10" formAction={signIn}>
              Ingresar
            </Button>
            <Button type="submit" size="lg" className="h-10" variant="outline" formAction={signUp}>
              Crear cuenta
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
