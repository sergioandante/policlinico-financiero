import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede } from "@/lib/permisos";
import { obtenerSolicitudesCompra } from "@/lib/consultas/compras";
import { obtenerAreasActivas } from "@/lib/consultas/areas";
import { SolicitudDialog } from "@/components/compras/solicitud-dialog";
import { SolicitudesTable } from "@/components/compras/solicitudes-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; areaId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "verCompras")) redirect("/dashboard");

  const filtros = await searchParams;
  const [solicitudes, areas] = await Promise.all([obtenerSolicitudesCompra(filtros), obtenerAreasActivas()]);
  const puedeCrear = puede(session.user.rol, "crearSolicitudCompra");
  const puedeAprobar = puede(session.user.rol, "aprobarSolicitudCompra");

  const pendientes = solicitudes.filter((s) => s.estado === "PENDIENTE").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Solicitudes de Compra</h1>
          <p className="text-sm text-muted-foreground">
            {pendientes > 0 ? `${pendientes} solicitud(es) pendientes de resolución.` : "Todo al día."}
          </p>
        </div>
        {puedeCrear && <SolicitudDialog areas={areas} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de solicitudes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-wrap items-end gap-3" method="GET">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Estado</label>
              <select name="estado" defaultValue={filtros.estado ?? ""} className="h-9 rounded-md border border-input bg-white px-3 text-sm">
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="APROBADA">Aprobada</option>
                <option value="RECHAZADA">Rechazada</option>
                <option value="COMPLETADA">Completada</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Área</label>
              <select name="areaId" defaultValue={filtros.areaId ?? ""} className="h-9 rounded-md border border-input bg-white px-3 text-sm">
                <option value="">Todas</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="outline" size="sm">
              Filtrar
            </Button>
          </form>

          <SolicitudesTable solicitudes={solicitudes} puedeAprobar={puedeAprobar} />
        </CardContent>
      </Card>
    </div>
  );
}
