import { Button } from "@/components/ui/button";

// Borrado en dos pasos sin JavaScript: primero se despliega, después se confirma.
export function DeleteForm({ action, what }: { action: () => Promise<void>; what: string }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer list-none text-right text-muted-foreground hover:text-foreground">
        Borrar
      </summary>
      <form action={action} className="mt-2">
        <Button type="submit" variant="destructive" size="sm">
          Confirmar: borrar {what}
        </Button>
      </form>
    </details>
  );
}

// Checkbox con forma de botón: blanco cuando está marcado. Funciona sin JavaScript.
export function ToggleChip({
  name,
  value = "on",
  label,
  defaultChecked,
  ariaLabel,
}: {
  name: string;
  value?: string;
  label: string;
  defaultChecked?: boolean;
  ariaLabel?: string;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        aria-label={ariaLabel}
        className="peer sr-only"
      />
      <span className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-muted-foreground transition-colors select-none peer-checked:border-white peer-checked:bg-white peer-checked:text-black peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
        {label}
      </span>
    </label>
  );
}

export const shortDate = (d: Date) =>
  d.toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });

export const backLink = "text-sm text-muted-foreground hover:text-foreground";
