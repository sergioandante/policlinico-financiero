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
import { crearItemInventario, actualizarItemInventario } from "@/lib/actions/inventario";
import { PlusCircle, Pencil } from "lucide-react";

const initialState = { ok: false, error: null as string | null };

type ItemExistente = {
  id: string;
  nombre: string;
  categoria: string;
  unidadMedida: string;
  stockActual: number;
  stockMinimo: number;
  fechaVencimiento: string | null;
};

export function NuevoItemDialog({ item }: { item?: ItemExistente }) {
  const esEdicion = !!item;
  const [open, setOpen] = useState(false);
  const accion = esEdicion ? actualizarItemInventario.bind(null, item!.id) : crearItemInventario;
  const [state, formAction, pending] = useActionState(accion, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success(esEdicion ? "Ítem actualizado correctamente." : "Ítem agregado al inventario.");
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, esEdicion]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {esEdicion ? (
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Pencil className="w-4 h-4" />
          </Button>
        ) : (
          <Button size="sm">
            <PlusCircle className="w-4 h-4" />
            Nuevo ítem
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar ítem de inventario" : "Agregar ítem de inventario"}</DialogTitle>
          <DialogDescription>Vacunas, suplementos e insumos médicos.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input name="nombre" required placeholder="Ej. Vacuna refuerzo metabólico" defaultValue={item?.nombre} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoría</Label>
              <Input name="categoria" required placeholder="Vacunas / Suplementos / Insumos" defaultValue={item?.categoria} />
            </div>
            <div className="space-y-1.5">
              <Label>Unidad de medida</Label>
              <Input name="unidadMedida" required placeholder="dosis, caja, frasco..." defaultValue={item?.unidadMedida} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Stock actual</Label>
              <Input name="stockActual" type="number" min="0" required defaultValue={item?.stockActual ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label>Stock mínimo (alerta)</Label>
              <Input name="stockMinimo" type="number" min="0" required defaultValue={item?.stockMinimo ?? 0} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Fecha de vencimiento (opcional)</Label>
            <Input name="fechaVencimiento" type="date" defaultValue={item?.fechaVencimiento ?? undefined} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : esEdicion ? "Guardar cambios" : "Guardar ítem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
