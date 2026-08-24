import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede } from "@/lib/permisos";
import { obtenerCategorias } from "@/lib/consultas/transacciones";
import { obtenerAreasActivas } from "@/lib/consultas/areas";
import { ImportarExcel } from "@/components/transacciones/importar-excel";

export default async function ImportarPage() {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "importarExcel")) redirect("/transacciones");

  const [categorias, areas] = await Promise.all([obtenerCategorias(), obtenerAreasActivas()]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Importar ventas históricas</h1>
        <p className="text-sm text-muted-foreground">
          Sube el Excel de ventas históricas. Cada fila se valida contra las categorías configuradas antes de
          importarse — nada se guarda hasta que confirmes.
        </p>
      </div>

      <ImportarExcel categorias={categorias} areas={areas} />
    </div>
  );
}
