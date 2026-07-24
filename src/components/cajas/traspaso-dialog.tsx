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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { registrarTraspaso } from "@/lib/actions/cajas";
import { ArrowLeftRight } from "lucide-react";

const initialState = { ok: false, error: null as string | null };

export function TraspasoDialog({ cajas }: { cajas: { id: string; nombre: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(registrarTraspaso, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success("Traspaso registrado correctamente.");
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ArrowLeftRight className="w-4 h-4" />
          Traspaso entre cajas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Traspaso entre cajas</DialogTitle>
          <DialogDescription>
            Se registran automáticamente dos movimientos ligados: salida en origen y entrada en destino.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Caja origen</Label>
              <Select name="cajaOrigenId" defaultValue={cajas[1]?.id} required>
                <SelectTrigger>
                  <SelectValue placeholder="Origen" />
                </SelectTrigger>
                <SelectContent>
                  {cajas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Caja destino</Label>
              <Select name="cajaDestinoId" defaultValue={cajas[0]?.id} required>
                <SelectTrigger>
                  <SelectValue placeholder="Destino" />
                </SelectTrigger>
                <SelectContent>
                  {cajas.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Monto (S/)</Label>
            <Input name="monto" type="number" step="0.01" min="0.01" required placeholder="0.00" />
          </div>

          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Input name="descripcion" required placeholder="Ej. Refuerzo de caja chica para gastos operativos" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Confirmar traspaso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
