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
import { crearCategoria, actualizarCategoria } from "@/lib/actions/categorias";
import { PlusCircle, Pencil } from "lucide-react";

const initialState = { ok: false, error: null as string | null };

type CategoriaExistente = { id: string; nombre: string; esFijo: boolean };

// Diálogo chico para crear o editar una categoría. En modo creación se usa
// anidado dentro de TransaccionDialog (para no quedar limitados a la lista
// del seed); en modo edición se usa desde la página /categorias.
export function NuevaCategoriaDialog({
  tipo,
  categoria,
  inline,
}: {
  tipo: "INGRESO" | "EGRESO";
  categoria?: CategoriaExistente;
  // true = link chico anidado en TransaccionDialog; false/undefined = botón
  // normal (usado en /categorias, donde debe distinguirse de ingreso/egreso).
  inline?: boolean;
}) {
  const esEdicion = !!categoria;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const accion = esEdicion ? actualizarCategoria.bind(null, categoria!.id) : crearCategoria;
  const [state, formAction, pending] = useActionState(accion, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success(
        esEdicion ? "Categoría actualizada correctamente." : "Categoría creada. Selecciónala en la lista de arriba."
      );
      setOpen(false);
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, esEdicion, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {esEdicion ? (
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : inline ? (
          <Button type="button" size="sm" variant="ghost" className="h-auto p-0 text-xs font-normal text-brand-600">
            <PlusCircle className="w-3.5 h-3.5" />
            Nueva categoría
          </Button>
        ) : (
          <Button size="sm">
            <PlusCircle className="w-4 h-4" />
            Nueva categoría de {tipo === "INGRESO" ? "ingreso" : "egreso"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {esEdicion ? "Editar categoría" : `Nueva categoría de ${tipo === "INGRESO" ? "ingreso" : "egreso"}`}
          </DialogTitle>
          <DialogDescription>Se agrega a la lista y queda disponible para todas las transacciones.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {!esEdicion && <input type="hidden" name="tipo" value={tipo} />}
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input name="nombre" required autoFocus placeholder="Ej. Fisioterapia" defaultValue={categoria?.nombre} />
          </div>
          {tipo === "EGRESO" && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                name="esFijo"
                className="h-4 w-4 rounded border-input"
                defaultChecked={categoria?.esFijo}
              />
              Es un gasto fijo (se repite todos los meses)
            </label>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
