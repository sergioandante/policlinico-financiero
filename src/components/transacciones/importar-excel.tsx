"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatearMoneda } from "@/lib/utils";
import { UploadCloud, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { clasificarTransaccion, AREA_LABELS, SUBCLASE_BP_LABELS, type Area } from "@/lib/clasificacion-areas";

// tipo viene de Prisma como string (SQLite no soporta enums nativos).
type Categoria = { id: string; nombre: string; tipo: string };

type FilaProcesada = {
  tipo: "INGRESO" | "EGRESO" | null;
  monto: number | null;
  fecha: string | null;
  categoriaNombre: string;
  categoriaId: string | null;
  descripcion: string;
  metodoPago: string;
  valida: boolean;
  errores: string[];
  // Clasificación automática por área (solo informativa en el preview; el
  // servidor la vuelve a calcular al guardar, ver crearTransaccionesEnLote).
  area: Area | null;
  subclaseLabel: string | null;
  posiblePagoMultiple: boolean;
};

// Normaliza texto para hacer matching tolerante a tildes/mayúsculas
function normalizar(texto: string) {
  return texto
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parsearFila(row: any, categorias: Categoria[]): FilaProcesada {
  const errores: string[] = [];

  // Acepta encabezados en español con distintas variantes
  const rawTipo = row.Tipo ?? row.tipo ?? row.TIPO;
  const rawMonto = row.Monto ?? row.monto ?? row.MONTO ?? row.Importe;
  const rawFecha = row.Fecha ?? row.fecha ?? row.FECHA;
  const rawCategoria = row.Categoria ?? row.categoria ?? row["Categoría"] ?? "";
  const rawDescripcion = row.Descripcion ?? row.descripcion ?? row["Descripción"] ?? "";
  const rawMetodo = row.MetodoPago ?? row["Método de pago"] ?? row.metodoPago ?? "Efectivo";

  let tipo: "INGRESO" | "EGRESO" | null = null;
  const tipoNorm = normalizar(rawTipo ?? "");
  if (tipoNorm.startsWith("ingreso")) tipo = "INGRESO";
  else if (tipoNorm.startsWith("egreso")) tipo = "EGRESO";
  else errores.push("Tipo debe ser Ingreso o Egreso");

  const monto = typeof rawMonto === "number" ? rawMonto : parseFloat(String(rawMonto).replace(/,/g, ""));
  if (!monto || monto <= 0) errores.push("Monto inválido");

  let fechaISO: string | null = null;
  if (rawFecha instanceof Date) {
    fechaISO = rawFecha.toISOString();
  } else if (typeof rawFecha === "number") {
    // fecha serial de Excel
    const fecha = XLSX.SSF.parse_date_code(rawFecha);
    fechaISO = new Date(fecha.y, fecha.m - 1, fecha.d).toISOString();
  } else if (typeof rawFecha === "string" && rawFecha.trim()) {
    const d = new Date(rawFecha);
    if (!isNaN(d.getTime())) fechaISO = d.toISOString();
  }
  if (!fechaISO) errores.push("Fecha inválida");

  const categoriasDelTipo = tipo ? categorias.filter((c) => c.tipo === tipo) : categorias;
  const categoriaEncontrada = categoriasDelTipo.find((c) => normalizar(c.nombre) === normalizar(rawCategoria));
  if (!categoriaEncontrada) errores.push(`Categoría "${rawCategoria}" no coincide con ninguna configurada`);

  if (!rawDescripcion) errores.push("Falta descripción");

  const metodoMap: Record<string, string> = {
    efectivo: "EFECTIVO",
    tarjeta: "TARJETA",
    transferencia: "TRANSFERENCIA",
    yape: "YAPE_PLIN",
    plin: "YAPE_PLIN",
  };
  const metodoPago = metodoMap[normalizar(rawMetodo)] ?? "EFECTIVO";

  // Clasificación automática por área/especialidad a partir de la
  // descripción — reemplaza la revisión manual fila por fila.
  let area: Area | null = null;
  let subclaseLabel: string | null = null;
  let posiblePagoMultiple = false;
  if (tipo === "INGRESO" && monto) {
    const clasificacion = clasificarTransaccion(String(rawDescripcion), monto);
    area = clasificacion.area;
    posiblePagoMultiple = clasificacion.posiblePagoMultiple;
    if (clasificacion.area === "BP" && clasificacion.subclaseBP) {
      subclaseLabel = SUBCLASE_BP_LABELS[clasificacion.subclaseBP];
    }
  }

  return {
    tipo,
    monto: monto || null,
    fecha: fechaISO,
    categoriaNombre: rawCategoria,
    categoriaId: categoriaEncontrada?.id ?? null,
    descripcion: String(rawDescripcion),
    metodoPago,
    valida: errores.length === 0,
    errores,
    area,
    subclaseLabel,
    posiblePagoMultiple,
  };
}

export function ImportarExcel({ categorias }: { categorias: Categoria[] }) {
  const router = useRouter();
  const [filas, setFilas] = useState<FilaProcesada[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNombreArchivo(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary", cellDates: true });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const filasCrudas = XLSX.utils.sheet_to_json(hoja);
      const procesadas = filasCrudas.map((f) => parsearFila(f, categorias));
      setFilas(procesadas);
    };
    reader.readAsBinaryString(file);
  }

  const validas = filas.filter((f) => f.valida);
  const invalidas = filas.filter((f) => !f.valida);
  const revisarManualmente = validas.filter((f) => f.subclaseLabel === SUBCLASE_BP_LABELS.REVISAR);

  const totalesPorArea = validas.reduce<Record<string, number>>((acc, f) => {
    if (!f.area || !f.monto) return acc;
    acc[f.area] = (acc[f.area] ?? 0) + f.monto;
    return acc;
  }, {});

  async function confirmarImportacion() {
    setEnviando(true);
    try {
      const res = await fetch("/api/transacciones/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filas: validas.map((f) => ({
            tipo: f.tipo,
            monto: f.monto,
            fecha: f.fecha,
            categoriaId: f.categoriaId,
            descripcion: f.descripcion,
            metodoPago: f.metodoPago,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al importar");
      toast.success(`Se importaron ${json.insertadas} transacciones.`);
      router.push("/transacciones");
    } catch (e: any) {
      toast.error(e.message ?? "Error al importar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-6">
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-300 bg-brand-50/50 p-10 cursor-pointer hover:bg-brand-50 transition-colors">
            <UploadCloud className="w-8 h-8 text-brand-600" />
            <span className="text-sm font-medium">
              {nombreArchivo ?? "Haz clic para subir tu archivo .xlsx de ventas históricas"}
            </span>
            <span className="text-xs text-muted-foreground">
              Columnas esperadas: Fecha, Tipo, Categoria, Monto, Descripcion, MetodoPago (opcional)
            </span>
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
          </label>
        </CardContent>
      </Card>

      {filas.length > 0 && (
        <>
          <div className="flex flex-wrap gap-3">
            <Badge variant="success" className="text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {validas.length} filas listas para importar
            </Badge>
            {invalidas.length > 0 && (
              <Badge variant="destructive" className="text-sm">
                <XCircle className="w-3.5 h-3.5 mr-1" /> {invalidas.length} filas con errores (se omitirán)
              </Badge>
            )}
            {revisarManualmente.length > 0 && (
              <Badge variant="warning" className="text-sm">
                <AlertCircle className="w-3.5 h-3.5 mr-1" /> {revisarManualmente.length} filas BP entre S/350 y
                S/600 para revisar manualmente
              </Badge>
            )}
          </div>

          {Object.keys(totalesPorArea).length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-3">Clasificación automática por área (este lote)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(totalesPorArea).map(([area, total]) => (
                    <div key={area} className="rounded-md border border-border bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">{AREA_LABELS[area as Area]}</p>
                      <p className="font-tabular font-semibold">{formatearMoneda(total)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6 max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filas.map((f, i) => (
                    <TableRow key={i} className={!f.valida ? "bg-egreso-bg/40" : ""}>
                      <TableCell>
                        {f.valida ? (
                          <CheckCircle2 className="w-4 h-4 text-ingreso" />
                        ) : (
                          <span title={f.errores.join(", ")}>
                            <XCircle className="w-4 h-4 text-egreso" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{f.tipo ?? "—"}</TableCell>
                      <TableCell className="text-sm">{f.categoriaNombre || "—"}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">{f.descripcion || "—"}</TableCell>
                      <TableCell className="text-sm">
                        {f.area ? (
                          <div className="flex flex-col gap-0.5">
                            <Badge variant="secondary" className="w-fit text-xs">
                              {AREA_LABELS[f.area]}
                            </Badge>
                            {f.subclaseLabel && (
                              <span
                                className={
                                  f.subclaseLabel === SUBCLASE_BP_LABELS.REVISAR
                                    ? "text-xs text-alerta"
                                    : "text-xs text-muted-foreground"
                                }
                              >
                                {f.subclaseLabel}
                                {f.posiblePagoMultiple ? " · posible pago múltiple" : ""}
                              </span>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-tabular text-sm">
                        {f.monto ? formatearMoneda(f.monto) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Button onClick={confirmarImportacion} disabled={validas.length === 0 || enviando}>
            {enviando ? "Importando..." : `Confirmar importación de ${validas.length} filas`}
          </Button>
        </>
      )}
    </div>
  );
}
