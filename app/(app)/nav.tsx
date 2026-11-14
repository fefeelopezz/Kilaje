"use client";

import { ChartLine, Dumbbell, History, House, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// `match`: prefijos de URL que también marcan la sección como activa.
const ITEMS = [
  { href: "/", label: "Inicio", icon: House, match: [] },
  { href: "/rutinas", label: "Rutinas", icon: Dumbbell, match: ["/rutinas", "/dias"] },
  { href: "/progreso", label: "Progreso", icon: ChartLine, match: ["/progreso", "/ejercicios"] },
  { href: "/historial", label: "Historial", icon: History, match: ["/historial"] },
  { href: "/perfil", label: "Perfil", icon: User, match: ["/perfil"] },
];

export function Nav({ variant }: { variant: "side" | "bottom" }) {
  const path = usePathname();
  const active = (i: (typeof ITEMS)[number]) =>
    path === i.href || i.match.some((m) => path.startsWith(m));

  if (variant === "bottom")
    return (
      <nav aria-label="Secciones" className="grid grid-cols-5">
        {ITEMS.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active(i) ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground",
              active(i) && "text-foreground",
            )}
          >
            <i.icon className="size-5" aria-hidden />
            {i.label}
          </Link>
        ))}
      </nav>
    );

  return (
    <nav aria-label="Secciones" className="flex flex-col gap-1">
      {ITEMS.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={active(i) ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground",
            active(i) &&
              "border-white/10 bg-white/[0.06] text-foreground shadow-[inset_0_1px_0_0_rgb(255_255_255/0.08)]",
          )}
        >
          <i.icon className="size-4" aria-hidden />
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
