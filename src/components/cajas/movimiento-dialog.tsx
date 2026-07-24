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
import { registrarMovimientoCaja } from "@/lib/actions/cajas";
import { PlusCircle } from "lucide-react";

const initialState = { ok: false, error: null as string | null };

export function MovimientoDialog({ cajas }: { cajas: { id: string; nombre: string }[] }) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState("INGRESO");
  const [state, formAction, pending] = useActionState(registrarMovimientoCaja, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success("Movimiento registrado correctamente.");
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const esSalidaConBeneficiario = tipo === "RETIRO" || tipo === "ADELANTO_SUELDO";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="w-4 h-4" />
          Nuevo movimiento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar movimiento de caja</DialogTitle>
          <DialogDescription>Ingresos, egresos, retiros o adelantos de sueldo.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Caja</Label>
              <Select name="cajaId" defaultValue={cajas[0]?.id} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona caja" />
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
              <Label>Tipo de movimiento</Label>
              <Select name="tipo" value={tipo} onValueChange={setTipo} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INGRESO">Ingreso</SelectItem>
                  <SelectItem value="EGRESO">Egreso</SelectItem>
                  <SelectItem value="RETIRO">Retiro</SelectItem>
                  <SelectItem value="ADELANTO_SUELDO">Adelanto de sueldo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Monto (S/)</Label>
            <Input name="monto" type="number" step="0.01" min="0.01" required placeholder="0.00" />
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Input name="descripcion" required placeholder="Ej. Pago de servicio de luz - julio" />
          </div>

          {esSalidaConBeneficiario && (
            <div className="space-y-1.5">
              <Label>Beneficiario</Label>
              <Input name="beneficiario" placeholder="Nombre del colaborador" />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar movimiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
