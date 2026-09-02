"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { eliminarArea } from "@/lib/actions/areas";
import { Trash2 } from "lucide-react";

export function EliminarAreaButton({ areaId, nombre }: { areaId: string; nombre: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`¿Eliminar el área "${nombre}"? Esto no se puede deshacer.`)) return;
    startTransition(async () => {
      const res = await eliminarArea(areaId);
      if (res.ok) {
        toast.success("Área eliminada.");
      } else {
        toast.error(res.error ?? "Error");
      }
    });
  }

  return (
    <Button size="icon" variant="ghost" className="h-8 w-8 text-egreso hover:text-egreso" onClick={handleClick} disabled={pending}>
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
