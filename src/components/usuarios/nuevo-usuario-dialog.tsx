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
import { crearUsuario, actualizarUsuario } from "@/lib/actions/usuarios";
import { UserPlus, Pencil } from "lucide-react";

const initialState = { ok: false, error: null as string | null };

type UsuarioExistente = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
};

export function NuevoUsuarioDialog({ usuario }: { usuario?: UsuarioExistente }) {
  const esEdicion = !!usuario;
  const [open, setOpen] = useState(false);
  const accion = esEdicion ? actualizarUsuario.bind(null, usuario!.id) : crearUsuario;
  const [state, formAction, pending] = useActionState(accion, initialState);

  useEffect(() => {
    if (state.ok) {
      toast.success(esEdicion ? "Usuario actualizado correctamente." : "Usuario creado correctamente.");
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
            <UserPlus className="w-4 h-4" />
            Nuevo usuario
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar usuario" : "Crear usuario"}</DialogTitle>
          <DialogDescription>Define su rol para controlar qué módulos puede ver y editar.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre completo</Label>
            <Input name="nombre" required placeholder="Ej. Ana Torres" defaultValue={usuario?.nombre} />
          </div>
          <div className="space-y-1.5">
            <Label>Correo</Label>
            <Input name="email" type="email" required placeholder="usuario@policlinico.pe" defaultValue={usuario?.email} />
          </div>
          <div className="space-y-1.5">
            <Label>{esEdicion ? "Nueva contraseña (opcional)" : "Contraseña temporal"}</Label>
            <Input
              name="password"
              type="password"
              required={!esEdicion}
              minLength={6}
              placeholder={esEdicion ? "Déjalo en blanco para no cambiarla" : "Mínimo 6 caracteres"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select name="rol" defaultValue={usuario?.rol} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMINISTRADOR">Administrador</SelectItem>
                <SelectItem value="GERENTE">Gerente</SelectItem>
                <SelectItem value="LOGISTICA">Logística</SelectItem>
                <SelectItem value="CONTADOR">Contador (solo lectura)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : esEdicion ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
