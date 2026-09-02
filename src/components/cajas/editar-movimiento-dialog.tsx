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
import { actualizarMovimientoCaja } from "@/lib/actions/cajas";
import { Pencil } from "lucide-react";
import { format } from "date-fns";

const initialState = { ok: false, error: null as string | null };

type MovimientoExistente = {
  id: string;
  monto: number;
  descripcion: string;
  beneficiario: string | null;
  fecha: Date;
  esSalidaConBeneficiario: boolean;
};

export function EditarMovimientoDialog({ movimiento }: { movimiento: MovimientoExistente }) {
  const [open, setOpen] = useState(false);
  const accion = actualizarMovimientoCaja.bind(null, movimiento.id);
  const [state, formAction, pending] = useActionState(accion, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success("Movimiento actualizado correctamente.");
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar movimiento</DialogTitle>
          <DialogDescription>El saldo de la caja se recalcula automáticamente al guardar.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Monto (S/)</Label>
              <Input name="monto" type="number" step="0.01" min="0.01" required defaultValue={movimiento.monto} />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha y hora</Label>
              <Input
                name="fecha"
                type="datetime-local"
                required
                defaultValue={format(movimiento.fecha, "yyyy-MM-dd'T'HH:mm")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Input name="descripcion" required defaultValue={movimiento.descripcion} />
          </div>

          {movimiento.esSalidaConBeneficiario && (
            <div className="space-y-1.5">
              <Label>Beneficiario</Label>
              <Input name="beneficiario" defaultValue={movimiento.beneficiario ?? undefined} placeholder="Nombre" />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
