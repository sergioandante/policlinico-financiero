"use client";

import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExportarExcelButton({
  data,
  nombreArchivo,
  hojaNombre = "Datos",
}: {
  data: Record<string, unknown>[];
  nombreArchivo: string;
  hojaNombre?: string;
}) {
  function exportar() {
    const hoja = XLSX.utils.json_to_sheet(data);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, hojaNombre);
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(libro, `${nombreArchivo}-${fecha}.xlsx`);
  }

  return (
    <Button variant="outline" size="sm" onClick={exportar} disabled={data.length === 0}>
      <Download className="w-4 h-4" />
      Exportar Excel
    </Button>
  );
}
