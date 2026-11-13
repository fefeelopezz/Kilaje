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

export const shortDate = (d: Date) =>
  d.toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit" });

export const backLink = "text-sm text-muted-foreground hover:text-foreground";
