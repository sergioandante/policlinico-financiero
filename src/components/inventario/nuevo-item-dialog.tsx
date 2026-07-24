"use client";

import { useActionState, useEffect, useState } from "react";
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
import { crearItemInventario } from "@/lib/actions/inventario";
import { PlusCircle } from "lucide-react";

const initialState = { ok: false, error: null as string | null };

export function NuevoItemDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(crearItemInventario, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success("Ítem agregado al inventario.");
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="w-4 h-4" />
          Nuevo ítem
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar ítem de inventario</DialogTitle>
          <DialogDescription>Vacunas, suplementos e insumos médicos.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input name="nombre" required placeholder="Ej. Vacuna refuerzo metabólico" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Input name="categoria" required placeholder="Vacunas / Suplementos / Insumos" />
            </div>
            <div className="space-y-1.5">
              <Label>Unidad de medida</Label>
              <Input name="unidadMedida" required placeholder="dosis, caja, frasco..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Stock actual</Label>
              <Input name="stockActual" type="number" min="0" required defaultValue={0} />
            </div>
            <div className="space-y-1.5">
              <Label>Stock mínimo (alerta)</Label>
              <Input name="stockMinimo" type="number" min="0" required defaultValue={0} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Fecha de vencimiento (opcional)</Label>
            <Input name="fechaVencimiento" type="date" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar ítem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
