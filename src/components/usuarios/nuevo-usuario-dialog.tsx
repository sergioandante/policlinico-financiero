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
import { crearUsuario } from "@/lib/actions/usuarios";
import { UserPlus } from "lucide-react";

const initialState = { ok: false, error: null as string | null };

export function NuevoUsuarioDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(crearUsuario, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success("Usuario creado correctamente.");
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="w-4 h-4" />
          Nuevo usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogDescription>Define su rol para controlar qué módulos puede ver y editar.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre completo</Label>
            <Input name="nombre" required placeholder="Ej. Ana Torres" />
          </div>
          <div className="space-y-1.5">
            <Label>Correo</Label>
            <Input name="email" type="email" required placeholder="usuario@policlinico.pe" />
          </div>
          <div className="space-y-1.5">
            <Label>Contraseña temporal</Label>
            <Input name="password" type="password" required minLength={6} placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select name="rol" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                <SelectItem value="GERENTE">Gerente</SelectItem>
                <SelectItem value="LOGISTICA">Logística</SelectItem>
                <SelectItem value="CONTADOR">Contador (solo lectura)</SelectItem>
                <SelectItem value="DOCTOR">Doctor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creando..." : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
