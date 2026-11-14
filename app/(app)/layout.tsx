import { LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { Nav } from "./nav";

// Lee la sesión: se permite que la navegación espere al servidor.
export const instant = false;

const Logo = () => (
  <Link href="/" className="text-xl font-semibold tracking-tight">
    Kilaje
  </Link>
);

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-1">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-white/10 bg-white/[0.02] p-4 backdrop-blur-md md:flex">
        <div className="px-3 pt-2">
          <Logo />
        </div>
        <Nav variant="side" />
        <div className="mt-auto flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="icon-sm" aria-label="Salir">
              <LogOut />
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/60 px-4 py-3 backdrop-blur-md md:hidden">
          <Logo />
          <span className="truncate text-sm text-muted-foreground">{user.name}</span>
        </header>
        {/* pb-24: deja lugar para el menú inferior en el celular. */}
        <div className="flex-1 pb-24 md:pb-0">{children}</div>
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-white/10 bg-black/70 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
          <Nav variant="bottom" />
        </div>
      </div>
    </div>
  );
}
