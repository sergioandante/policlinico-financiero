"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cambiarEstadoUsuario } from "@/lib/actions/usuarios";

export function ToggleUsuarioButton({ usuarioId, activo }: { usuarioId: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await cambiarEstadoUsuario(usuarioId, !activo);
      if (res.ok) {
        toast.success(activo ? "Usuario desactivado." : "Usuario activado.");
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  return (
    <Button size="sm" variant={activo ? "outline" : "default"} onClick={handleClick} disabled={pending}>
      {activo ? "Desactivar" : "Activar"}
    </Button>
  );
}
