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
import { crearPresupuesto, actualizarPresupuesto } from "@/lib/actions/presupuestos";
import { PlusCircle, Pencil } from "lucide-react";

const initialState = { ok: false, error: null as string | null };
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type PresupuestoExistente = {
  id: string;
  nombre: string;
  areaId: string;
  montoAsignado: number;
  periodoMes: number;
  periodoAnio: number;
  umbralAlerta: number;
};

export function NuevoPresupuestoDialog({
  areas,
  presupuesto,
}: {
  areas: { id: string; nombre: string }[];
  presupuesto?: PresupuestoExistente;
}) {
  const esEdicion = !!presupuesto;
  const [open, setOpen] = useState(false);
  const accion = esEdicion ? actualizarPresupuesto.bind(null, presupuesto!.id) : crearPresupuesto;
  const [state, formAction, pending] = useActionState(accion, initialState);
  const hoy = new Date();

  useEffect(() => {
    if (state.ok) {
      toast.success(esEdicion ? "Presupuesto actualizado correctamente." : "Presupuesto creado correctamente.");
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
            Nuevo presupuesto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar presupuesto" : "Crear presupuesto"}</DialogTitle>
          <DialogDescription>Asigna un monto máximo por área y periodo.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Área</Label>
            <Select name="areaId" defaultValue={presupuesto?.areaId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona área" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Nombre del presupuesto</Label>
            <Input name="nombre" required placeholder="Ej. Cardiología - Agosto 2026" defaultValue={presupuesto?.nombre} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Mes</Label>
              <Select name="periodoMes" defaultValue={String(presupuesto?.periodoMes ?? hoy.getMonth() + 1)} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Año</Label>
              <Input name="periodoAnio" type="number" defaultValue={presupuesto?.periodoAnio ?? hoy.getFullYear()} required />
            </div>
            <div className="space-y-1.5">
              <Label>Alerta (%)</Label>
              <Input name="umbralAlerta" type="number" defaultValue={presupuesto?.umbralAlerta ?? 80} min={1} max={100} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Monto asignado (S/)</Label>
            <Input
              name="montoAsignado"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="8250.00"
              defaultValue={presupuesto?.montoAsignado}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear presupuesto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
