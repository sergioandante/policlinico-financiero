// ============================================================================
// CLASIFICACIÓN AUTOMÁTICA POR ÁREA / ESPECIALIDAD
//
// Reglas definidas con el cliente (reunión de avance, ver notas del
// proyecto) para reemplazar el filtrado y revisión manual, fila por fila,
// del reporte que exportan de la plataforma actual:
//
//   - BP:            cualquier concepto que mencione "BP", excluyendo los
//                     que mencionen "Bío" (para no cruzar con otro servicio).
//   - C HG:           Chequeo General Completo.
//   - TR:             Traumatología.
//   - Odontología:    match directo por el nombre.
//
// Para el área BP, además se subclasifica por el monto pagado:
//   - Hasta S/ 350 (inclusive)  -> Consulta
//   - S/ 600 a más              -> Compra de paquete ("mundar")
//   - Entre 350 y 600           -> zona sin regla definida: se marca para
//                                  revisión manual en vez de adivinar.
//
// SUPUESTO PENDIENTE DE CONFIRMAR CON EL CLIENTE (reunión del viernes):
// para detectar pagos combinados (ej. S/150 que agrupan 2 consultas BP) se
// asume un precio de referencia de consulta individual. Ajustar
// BP_PRECIO_CONSULTA_REFERENCIA en cuanto el cliente confirme el valor real;
// mientras tanto solo se usa para marcar "posiblePagoMultiple" como aviso,
// nunca para dividir el monto automáticamente.
// ============================================================================

export type Area = "BP" | "C_HG" | "TR" | "ODONTOLOGIA" | "OTROS";
export type SubclaseBP = "CONSULTA" | "PAQUETE" | "REVISAR";

export const AREA_LABELS: Record<Area, string> = {
  BP: "BP",
  C_HG: "Chequeo General Completo",
  TR: "Traumatología",
  ODONTOLOGIA: "Odontología",
  OTROS: "Otros",
};

export const SUBCLASE_BP_LABELS: Record<SubclaseBP, string> = {
  CONSULTA: "Consulta",
  PAQUETE: "Compra de paquete",
  REVISAR: "Revisar manualmente",
};

export const BP_UMBRAL_CONSULTA = 350;
export const BP_UMBRAL_PAQUETE = 600;
export const BP_PRECIO_CONSULTA_REFERENCIA = 75; // ver nota de supuesto arriba

function normalizar(texto: string): string {
  return texto
    .toString()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function clasificarArea(textoConcepto: string): Area {
  const t = normalizar(textoConcepto ?? "");

  if (t.includes("BP") && !t.includes("BIO")) return "BP";
  if (t.includes("C HG") || t.includes("CHG") || t.includes("CHEQUEO GENERAL")) return "C_HG";
  if (/\bTR\b/.test(t) || t.includes("TRAUMATOLOGIA")) return "TR";
  if (t.includes("ODONTO")) return "ODONTOLOGIA";

  return "OTROS";
}

export function clasificarSubclaseBP(monto: number): {
  subclase: SubclaseBP;
  posiblePagoMultiple: boolean;
  cantidadEstimada?: number;
} {
  if (monto <= BP_UMBRAL_CONSULTA) {
    const cantidadEstimada = Math.round(monto / BP_PRECIO_CONSULTA_REFERENCIA);
    const esMultiploLimpio =
      cantidadEstimada >= 2 && Math.abs(monto - cantidadEstimada * BP_PRECIO_CONSULTA_REFERENCIA) < 1;
    return {
      subclase: "CONSULTA",
      posiblePagoMultiple: esMultiploLimpio,
      cantidadEstimada: esMultiploLimpio ? cantidadEstimada : undefined,
    };
  }
  if (monto >= BP_UMBRAL_PAQUETE) {
    return { subclase: "PAQUETE", posiblePagoMultiple: false };
  }
  return { subclase: "REVISAR", posiblePagoMultiple: false };
}

export function clasificarTransaccion(textoConcepto: string, monto: number) {
  const area = clasificarArea(textoConcepto);
  if (area !== "BP") {
    return { area, subclaseBP: null as SubclaseBP | null, posiblePagoMultiple: false, cantidadEstimada: undefined as number | undefined };
  }
  const { subclase, posiblePagoMultiple, cantidadEstimada } = clasificarSubclaseBP(monto);
  return { area, subclaseBP: subclase, posiblePagoMultiple, cantidadEstimada };
}
