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
import { crearPresupuesto } from "@/lib/actions/presupuestos";
import { PlusCircle } from "lucide-react";

const initialState = { ok: false, error: null as string | null };
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function NuevoPresupuestoDialog({ categorias }: { categorias: { id: string; nombre: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(crearPresupuesto, initialState);
  const hoy = new Date();

  useEffect(() => {
    if (state.ok) {
      toast.success("Presupuesto creado correctamente.");
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
          Nuevo presupuesto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear presupuesto</DialogTitle>
          <DialogDescription>Asigna un monto máximo por categoría y periodo.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Categoría</Label>
            <Select name="categoriaId" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Nombre del presupuesto</Label>
            <Input name="nombre" required placeholder="Ej. Marketing - Julio 2026" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Mes</Label>
              <Select name="periodoMes" defaultValue={String(hoy.getMonth() + 1)} required>
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
              <Input name="periodoAnio" type="number" defaultValue={hoy.getFullYear()} required />
            </div>
            <div className="space-y-1.5">
              <Label>Alerta (%)</Label>
              <Input name="umbralAlerta" type="number" defaultValue={80} min={1} max={100} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Monto asignado (S/)</Label>
            <Input name="montoAsignado" type="number" step="0.01" min="0.01" required placeholder="8250.00" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Crear presupuesto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
