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
import { crearArea } from "@/lib/actions/areas";
import { PlusCircle } from "lucide-react";

const initialState = { ok: false, error: null as string | null };

export function NuevaAreaDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(crearArea, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success("Área creada correctamente.");
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
          Nueva área
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear área</DialogTitle>
          <DialogDescription>Departamento clínico o administrativo del policlínico.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input name="nombre" required placeholder="Ej. Fisioterapia" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select name="tipo" defaultValue="CLINICA" required>
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
              {pending ? "Guardando..." : "Crear área"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
