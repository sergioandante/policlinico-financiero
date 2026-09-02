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
import { crearArea, actualizarArea } from "@/lib/actions/areas";
import { PlusCircle, Pencil } from "lucide-react";

const initialState = { ok: false, error: null as string | null };

type AreaExistente = { id: string; nombre: string; tipo: string };

export function NuevaAreaDialog({ area }: { area?: AreaExistente }) {
  const esEdicion = !!area;
  const [open, setOpen] = useState(false);
  const accion = esEdicion ? actualizarArea.bind(null, area!.id) : crearArea;
  const [state, formAction, pending] = useActionState(accion, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success(esEdicion ? "Área actualizada correctamente." : "Área creada correctamente.");
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
            Nueva área
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar área" : "Crear área"}</DialogTitle>
          <DialogDescription>Departamento clínico o administrativo del policlínico.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input name="nombre" required placeholder="Ej. Fisioterapia" defaultValue={area?.nombre} />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select name="tipo" defaultValue={area?.tipo ?? "CLINICA"} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLINICA">Clínica</SelectItem>
                <SelectItem value="ADMINISTRATIVA">Administrativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear área"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
