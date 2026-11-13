import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { resendCode, verifyCode } from "@/app/actions";
import { backLink } from "@/app/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Depende de una cookie y de la URL: se permite que la navegación espere al servidor.
export const instant = false;

export default async function CodePage({ searchParams }: PageProps<"/login/codigo">) {
  const email = (await cookies()).get("kilaje_email")?.value;
  if (!email) redirect("/login");
  const { error, aviso } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-sm flex-1 p-4 pt-16">
      <Link href="/login" className={backLink}>
        ← Usar otro mail
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Ingresá el código</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Lo mandamos a <span className="text-foreground">{email}</span>. Vence en 5 minutos.
      </p>

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-4">
          <form action={verifyCode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="otp">Código de 6 dígitos</Label>
              <Input
                id="otp"
                className="h-12 text-center font-mono text-xl tracking-[0.4em]"
                name="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                autoFocus
                required
              />
            </div>
            {error === "codigo" && (
              <p role="alert" className="text-sm text-destructive">
                Código incorrecto o vencido. Después de 3 intentos fallidos hay que pedir uno nuevo.
              </p>
            )}
            {aviso === "reenviado" && (
              <p role="status" className="text-sm text-muted-foreground">
                Listo. Si pasó más de un minuto desde el anterior, te llega un código nuevo.
              </p>
            )}
            <Button type="submit" size="lg" className="h-10">
              Entrar
            </Button>
          </form>
          <form action={resendCode}>
            <Button type="submit" variant="ghost" size="lg" className="w-full">
              Reenviar código
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
