import { signOut, updateProfile } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Depende de la sesión y de la URL: se permite que la navegación espere al servidor.
export const instant = false;

export default async function Profile({ searchParams }: PageProps<"/perfil">) {
  const { id } = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id } });
  const { error, aviso } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-2xl p-4 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Perfil</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tus datos</CardTitle>
          <CardDescription>Entrás con un código que mandamos a {user.email}.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" className="h-10" name="name" defaultValue={user.name} maxLength={80} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="weight">Peso corporal (kg)</Label>
              <Input
                id="weight"
                className="h-10"
                name="weight"
                inputMode="decimal"
                pattern="[0-9]+([.,][0-9]+)?"
                defaultValue={user.weight ?? ""}
                required
              />
            </div>
            {error === "datos" && (
              <p role="alert" className="text-sm text-destructive">
                Revisá los datos: nombre y un peso entre 20 y 400 kg.
              </p>
            )}
            {aviso === "guardado" && (
              <p role="status" className="text-sm text-muted-foreground">
                Cambios guardados.
              </p>
            )}
            <Button type="submit" size="lg" className="h-10 self-start px-4">
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      <form action={signOut} className="mt-6">
        <Button type="submit" variant="outline" size="lg">
          Cerrar sesión
        </Button>
      </form>
    </main>
  );
}
