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
import { actualizarCaja } from "@/lib/actions/cajas";
import { Pencil } from "lucide-react";

const initialState = { ok: false, error: null as string | null };

export function EditarCajaDialog({ cajaId, nombre }: { cajaId: string; nombre: string }) {
  const [open, setOpen] = useState(false);
  const accion = actualizarCaja.bind(null, cajaId);
  const [state, formAction, pending] = useActionState(accion, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success("Caja actualizada correctamente.");
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar caja</DialogTitle>
          <DialogDescription>Solo el nombre — el saldo se ajusta registrando un movimiento.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input name="nombre" required defaultValue={nombre} placeholder="Ej. Caja chica (operativa)" />
          </div>

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
