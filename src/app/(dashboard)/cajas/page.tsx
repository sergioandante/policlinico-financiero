import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { puede } from "@/lib/permisos";
import { obtenerCajas, obtenerMovimientos } from "@/lib/consultas/cajas";
import { CajaBalanceCard } from "@/components/cajas/caja-balance-card";
import { MovimientoDialog } from "@/components/cajas/movimiento-dialog";
import { TraspasoDialog } from "@/components/cajas/traspaso-dialog";
import { MovimientosTable } from "@/components/cajas/movimientos-table";
import { ExportarExcelButton } from "@/components/shared/exportar-excel-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatearFechaHora } from "@/lib/utils";

export default async function CajasPage({
  searchParams,
}: {
  searchParams: Promise<{ cajaId?: string; tipo?: string; desde?: string; hasta?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "verCajas")) redirect("/dashboard");

  const filtros = await searchParams;
  const [cajas, movimientos] = await Promise.all([obtenerCajas(), obtenerMovimientos(filtros)]);
  const puedeRegistrar = puede(session.user.rol, "registrarMovimientoCaja");
  const puedeExportar = puede(session.user.rol, "exportarExcel");

  const filasExportar = movimientos.map((m) => ({
    Fecha: formatearFechaHora(m.fecha),
    Caja: m.caja,
    CajaDestino: m.cajaDestino ?? "",
    Tipo: m.tipo,
    Monto: m.monto,
    SaldoAnterior: m.saldoAnterior,
    SaldoNuevo: m.saldoNuevo,
    Descripcion: m.descripcion,
    Usuario: m.usuario,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Control de Cajas</h1>
          <p className="text-sm text-muted-foreground">Caja Chica y Caja Grande, con saldo en tiempo real.</p>
        </div>
        <div className="flex gap-2">
          {puedeExportar && (
            <ExportarExcelButton data={filasExportar} nombreArchivo="movimientos-caja" hojaNombre="Movimientos" />
          )}
          {puedeRegistrar && (
            <>
              <TraspasoDialog cajas={cajas} />
              <MovimientoDialog cajas={cajas} />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cajas.map((c) => (
          <CajaBalanceCard
            key={c.id}
            id={c.id}
            nombre={c.nombre}
            tipo={c.tipo}
            saldo={c.saldoActual}
            puedeEditar={puedeRegistrar}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de movimientos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros vía query params (GET) — sin necesidad de JS en el cliente */}
          <form className="flex flex-wrap items-end gap-3" method="GET">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Caja</label>
              <select
                name="cajaId"
                defaultValue={filtros.cajaId ?? ""}
                className="h-9 rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">Todas</option>
                {cajas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Tipo</label>
              <select
                name="tipo"
                defaultValue={filtros.tipo ?? ""}
                className="h-9 rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">Todos</option>
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
                <option value="TRASPASO_SALIDA">Traspaso (salida)</option>
                <option value="TRASPASO_ENTRADA">Traspaso (entrada)</option>
                <option value="RETIRO">Retiro</option>
                <option value="ADELANTO_SUELDO">Adelanto de sueldo</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Desde</label>
              <Input type="date" name="desde" defaultValue={filtros.desde} className="w-40" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Hasta</label>
              <Input type="date" name="hasta" defaultValue={filtros.hasta} className="w-40" />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Filtrar
            </Button>
          </form>

          <MovimientosTable movimientos={movimientos} />
        </CardContent>
      </Card>
    </div>
  );
}
