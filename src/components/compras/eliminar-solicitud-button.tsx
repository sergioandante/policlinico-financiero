"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { eliminarSolicitudCompra } from "@/lib/actions/compras";
import { Trash2 } from "lucide-react";

export function EliminarSolicitudButton({ solicitudId, codigo }: { solicitudId: string; codigo: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`¿Eliminar la solicitud ${codigo}? Esto no se puede deshacer.`)) return;
    startTransition(async () => {
      const res = await eliminarSolicitudCompra(solicitudId);
      if (res.ok) {
        toast.success("Solicitud eliminada.");
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
