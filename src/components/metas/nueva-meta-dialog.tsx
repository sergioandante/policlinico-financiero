"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { crearMeta, actualizarMeta } from "@/lib/actions/metas";
import { Target, Pencil } from "lucide-react";

const initialState = { ok: false, error: null as string | null };
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type MetaExistente = {
  id: string;
  nombre: string;
  tipo: string;
  areaId: string | null;
  montoObjetivo: number;
  periodoMes: number;
  periodoAnio: number;
  notas: string | null;
};

export function NuevaMetaDialog({
  areas,
  meta,
}: {
  areas: { id: string; nombre: string }[];
  meta?: MetaExistente;
}) {
  const esEdicion = !!meta;
  const [open, setOpen] = useState(false);
  const accion = esEdicion ? actualizarMeta.bind(null, meta!.id) : crearMeta;
  const [state, formAction, pending] = useActionState(accion, initialState);
  const hoy = new Date();

  useEffect(() => {
    if (state.ok) {
      toast.success(esEdicion ? "Meta actualizada correctamente." : "Meta creada correctamente.");
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
            <Target className="w-4 h-4" />
            Nueva meta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar meta económica" : "Crear meta económica"}</DialogTitle>
          <DialogDescription>De ingreso, ahorro o de reducción de gasto por área.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input name="nombre" required placeholder="Ej. Meta de ingresos - Setiembre" defaultValue={meta?.nombre} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select name="tipo" defaultValue={meta?.tipo ?? "INGRESO_MENSUAL"} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INGRESO_MENSUAL">Ingreso mensual</SelectItem>
                  <SelectItem value="AHORRO">Ahorro (utilidad)</SelectItem>
                  <SelectItem value="REDUCCION_GASTO">Tope / reducción de gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Área (opcional)</Label>
              <Select name="areaId" defaultValue={meta?.areaId ?? undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Todo el policlínico" />
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
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Mes</Label>
              <Select name="periodoMes" defaultValue={String(meta?.periodoMes ?? hoy.getMonth() + 1)} required>
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
              <Input name="periodoAnio" type="number" defaultValue={meta?.periodoAnio ?? hoy.getFullYear()} required />
            </div>
            <div className="space-y-1.5">
              <Label>Monto objetivo (S/)</Label>
              <Input
                name="montoObjetivo"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="10000.00"
                defaultValue={meta?.montoObjetivo}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea
              name="notas"
              placeholder="Contexto o plan de acción para llegar a la meta"
              defaultValue={meta?.notas ?? undefined}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
