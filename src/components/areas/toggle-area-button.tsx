"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cambiarEstadoArea } from "@/lib/actions/areas";

export function ToggleAreaButton({ areaId, activo }: { areaId: string; activo: boolean }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await cambiarEstadoArea(areaId, !activo);
      if (res.ok) {
        toast.success(activo ? "Área desactivada." : "Área activada.");
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
