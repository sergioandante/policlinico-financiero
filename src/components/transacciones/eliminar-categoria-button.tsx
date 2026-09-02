"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { eliminarCategoria } from "@/lib/actions/categorias";
import { Trash2 } from "lucide-react";

export function EliminarCategoriaButton({ categoriaId, nombre }: { categoriaId: string; nombre: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`¿Eliminar la categoría "${nombre}"? Esto no se puede deshacer.`)) return;
    startTransition(async () => {
      const res = await eliminarCategoria(categoriaId);
      if (res.ok) {
        toast.success("Categoría eliminada.");
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
