import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { puede } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { crearTransaccionesEnLote } from "@/lib/actions/transacciones";

const filaSchema = z.object({
  tipo: z.enum(["INGRESO", "EGRESO"]),
  monto: z.number().positive(),
  fecha: z.string(), // ISO
  categoriaId: z.string(),
  areaId: z.string().nullable().optional(),
  descripcion: z.string().min(1),
  metodoPago: z.enum(["EFECTIVO", "TARJETA", "TRANSFERENCIA", "YAPE_PLIN", "OTRO"]).default("EFECTIVO"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !puede(session.user.rol, "importarExcel")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = z.array(filaSchema).safeParse(body.filas);
  if (!parsed.success) {
    return NextResponse.json({ error: "Formato de filas inválido" }, { status: 400 });
  }

  // Verifica que las categorías realmente existan (defensa en profundidad)
  const categoriaIds = [...new Set(parsed.data.map((f) => f.categoriaId))];
  const categoriasValidas = await prisma.categoria.findMany({ where: { id: { in: categoriaIds } } });
  if (categoriasValidas.length !== categoriaIds.length) {
    return NextResponse.json({ error: "Alguna categoría enviada no existe" }, { status: 400 });
  }

  const areaIds = [...new Set(parsed.data.map((f) => f.areaId).filter((id): id is string => !!id))];
  if (areaIds.length > 0) {
    const areasValidas = await prisma.area.findMany({ where: { id: { in: areaIds } } });
    if (areasValidas.length !== areaIds.length) {
      return NextResponse.json({ error: "Alguna área enviada no existe" }, { status: 400 });
    }
  }

  await crearTransaccionesEnLote(
    parsed.data.map((f) => ({ ...f, fecha: new Date(f.fecha) })),
    session.user.id
  );

  return NextResponse.json({ ok: true, insertadas: parsed.data.length });
}
