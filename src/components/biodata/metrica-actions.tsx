"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { actualizarMetricaSalud, eliminarMetricaSalud } from "@/lib/actions/biodata";

const initialState = { ok: false, error: null as string | null };

type Metrica = {
  id: string;
  fechaISO: string;
  pesoKg: number;
  alturaCm: number;
  presionSistolica: number;
  presionDiastolica: number;
  notas: string | null;
};

export function MetricaActions({ metrica }: { metrica: Metrica }) {
  const [open, setOpen] = useState(false);
  const [editState, editAction, editPending] = useActionState(actualizarMetricaSalud, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(eliminarMetricaSalud, initialState);

  useEffect(() => {
    if (editState.ok) {
      toast.success("Métrica actualizada correctamente.");
      setOpen(false);
    } else if (editState.error) {
      toast.error(editState.error);
    }
  }, [editState]);

  useEffect(() => {
    if (deleteState.ok) {
      toast.success("Métrica eliminada.");
    } else if (deleteState.error) {
      toast.error(deleteState.error);
    }
  }, [deleteState]);

  return (
    <div className="flex items-center justify-end gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Editar registro">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar métrica</DialogTitle>
            <DialogDescription>Corrige los datos de este registro.</DialogDescription>
          </DialogHeader>
          <form action={editAction} className="space-y-4">
            <input type="hidden" name="id" value={metrica.id} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input name="fecha" type="date" defaultValue={metrica.fechaISO} required />
              </div>
              <div className="space-y-1.5">
                <Label>Peso (kg)</Label>
                <Input name="pesoKg" type="number" step="0.01" min="1" defaultValue={metrica.pesoKg} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Altura (cm)</Label>
              <Input name="alturaCm" type="number" step="0.01" min="1" defaultValue={metrica.alturaCm} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Presión sistólica (mmHg)</Label>
                <Input
                  name="presionSistolica"
                  type="number"
                  step="1"
                  min="50"
                  max="300"
                  defaultValue={metrica.presionSistolica}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Presión diastólica (mmHg)</Label>
                <Input
                  name="presionDiastolica"
                  type="number"
                  step="1"
                  min="30"
                  max="200"
                  defaultValue={metrica.presionDiastolica}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas (opcional)</Label>
              <Input name="notas" defaultValue={metrica.notas ?? ""} />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={editPending}>
                {editPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={metrica.id} />
        <Button variant="ghost" size="icon" type="submit" disabled={deletePending} aria-label="Eliminar registro">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </form>
    </div>
  );
}
