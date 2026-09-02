"use client";

import { useState, useTransition } from "react";
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
import { crearSolicitudCompra, actualizarSolicitudCompra } from "@/lib/actions/compras";
import { PlusCircle, Trash2, Pencil } from "lucide-react";
import { formatearMoneda } from "@/lib/utils";

type Area = { id: string; nombre: string };
type Item = { descripcion: string; cantidad: string; precioEstimado: string };
type SolicitudExistente = {
  id: string;
  areaId: string;
  justificacion: string;
  items: { descripcion: string; cantidad: number; precioEstimado: number }[];
};

export function SolicitudDialog({ areas, solicitud }: { areas: Area[]; solicitud?: SolicitudExistente }) {
  const esEdicion = !!solicitud;
  const [open, setOpen] = useState(false);
  const [areaId, setAreaId] = useState(solicitud?.areaId ?? areas[0]?.id ?? "");
  const [justificacion, setJustificacion] = useState(solicitud?.justificacion ?? "");
  const [items, setItems] = useState<Item[]>(
    solicitud
      ? solicitud.items.map((i) => ({
          descripcion: i.descripcion,
          cantidad: String(i.cantidad),
          precioEstimado: String(i.precioEstimado),
        }))
      : [{ descripcion: "", cantidad: "1", precioEstimado: "" }]
  );
  const [pending, startTransition] = useTransition();

  const total = items.reduce((sum, i) => sum + (Number(i.cantidad) || 0) * (Number(i.precioEstimado) || 0), 0);

  function actualizarItem(idx: number, campo: keyof Item, valor: string) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [campo]: valor } : it)));
  }

  function agregarItem() {
    setItems((prev) => [...prev, { descripcion: "", cantidad: "1", precioEstimado: "" }]);
  }

  function quitarItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function limpiar() {
    setAreaId(areas[0]?.id ?? "");
    setJustificacion("");
    setItems([{ descripcion: "", cantidad: "1", precioEstimado: "" }]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        areaId,
        justificacion,
        items: items
          .filter((i) => i.descripcion.trim())
          .map((i) => ({
            descripcion: i.descripcion,
            cantidad: Number(i.cantidad) || 1,
            precioEstimado: Number(i.precioEstimado) || 0,
          })),
      };
      const res = esEdicion
        ? await actualizarSolicitudCompra(solicitud!.id, payload)
        : await crearSolicitudCompra(payload);
      if (res.ok) {
        toast.success(esEdicion ? "Solicitud actualizada." : "Solicitud de compra creada.");
        setOpen(false);
        if (!esEdicion) limpiar();
      } else {
        toast.error(res.error ?? "Error al guardar la solicitud");
      }
    });
  }

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
            Nueva solicitud
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar solicitud de compra" : "Nueva solicitud de compra"}</DialogTitle>
          <DialogDescription>Reemplaza el formato en papel — queda registrada y trazable.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Área solicitante</Label>
            <Select value={areaId} onValueChange={setAreaId}>
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
            <Label>Justificación</Label>
            <Textarea
              required
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              placeholder="¿Por qué se necesita esta compra?"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ítems</Label>
              <Button type="button" size="sm" variant="outline" onClick={agregarItem}>
                <PlusCircle className="w-3.5 h-3.5" /> Agregar ítem
              </Button>
            </div>
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_70px_90px_auto] gap-2 items-center">
                <Input
                  placeholder="Descripción"
                  value={it.descripcion}
                  onChange={(e) => actualizarItem(idx, "descripcion", e.target.value)}
                  required
                />
                <Input
                  type="number"
                  min="1"
                  placeholder="Cant."
                  value={it.cantidad}
                  onChange={(e) => actualizarItem(idx, "cantidad", e.target.value)}
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="P. unit."
                  value={it.precioEstimado}
                  onChange={(e) => actualizarItem(idx, "precioEstimado", e.target.value)}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => quitarItem(idx)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="w-4 h-4 text-egreso" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center rounded-md bg-muted/60 p-3 text-sm font-medium">
            <span>Monto estimado total</span>
            <span className="font-tabular">{formatearMoneda(total)}</span>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : esEdicion ? "Guardar cambios" : "Enviar solicitud"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
