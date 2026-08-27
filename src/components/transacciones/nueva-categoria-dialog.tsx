"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { crearCategoria } from "@/lib/actions/categorias";
import { PlusCircle } from "lucide-react";

const initialState = { ok: false, error: null as string | null };

// Diálogo chico, anidado dentro de TransaccionDialog, para no quedar
// limitados a la lista de categorías del seed inicial.
export function NuevaCategoriaDialog({ tipo }: { tipo: "INGRESO" | "EGRESO" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(crearCategoria, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success("Categoría creada. Selecciónala en la lista de arriba.");
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost" className="h-auto p-0 text-xs font-normal text-brand-600">
          <PlusCircle className="w-3.5 h-3.5" />
          Nueva categoría
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva categoría de {tipo === "INGRESO" ? "ingreso" : "egreso"}</DialogTitle>
          <DialogDescription>Se agrega a la lista y queda disponible para todas las transacciones.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="tipo" value={tipo} />
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input name="nombre" required autoFocus placeholder="Ej. Fisioterapia" />
          </div>
          {tipo === "EGRESO" && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" name="esFijo" className="h-4 w-4 rounded border-input" />
              Es un gasto fijo (se repite todos los meses)
            </label>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creando..." : "Crear categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
