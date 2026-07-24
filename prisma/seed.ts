import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Sembrando base de datos...");

  // ---------- USUARIOS ----------
  const passwordHash = await bcrypt.hash("policlinico2026", 10);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@policlinico.pe" },
    update: {},
    create: {
      nombre: "Rosa Medina (Administradora)",
      email: "admin@policlinico.pe",
      passwordHash,
      rol: "ADMINISTRADOR",
    },
  });

  const gerente = await prisma.usuario.upsert({
    where: { email: "gerencia@policlinico.pe" },
    update: {},
    create: {
      nombre: "Jorge Salas (Gerente)",
      email: "gerencia@policlinico.pe",
      passwordHash,
      rol: "GERENTE",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "logistica@policlinico.pe" },
    update: {},
    create: {
      nombre: "Mariana Quispe (Logística)",
      email: "logistica@policlinico.pe",
      passwordHash,
      rol: "LOGISTICA",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "contabilidad@policlinico.pe" },
    update: {},
    create: {
      nombre: "Luis Fernández (Contador)",
      email: "contabilidad@policlinico.pe",
      passwordHash,
      rol: "CONTADOR",
    },
  });

  const doctor = await prisma.usuario.upsert({
    where: { email: "doctor@policlinico.pe" },
    update: {},
    create: {
      nombre: "Dr. Andrés Vidal",
      email: "doctor@policlinico.pe",
      passwordHash,
      rol: "DOCTOR",
    },
  });

  // ---------- CATEGORÍAS ----------
  const catVentas = await prisma.categoria.create({
    data: { nombre: "Ventas de programas", tipo: "INGRESO" },
  });
  await prisma.categoria.createMany({
    data: [
      { nombre: "Programa Pérdida de Peso - Básico", tipo: "INGRESO", parentId: catVentas.id },
      { nombre: "Programa Pérdida de Peso - Premium", tipo: "INGRESO", parentId: catVentas.id },
      { nombre: "Consultas nutricionales", tipo: "INGRESO", parentId: catVentas.id },
    ],
  });
  const catOtrosIngresos = await prisma.categoria.create({
    data: { nombre: "Otros ingresos", tipo: "INGRESO" },
  });

  const catSalarios = await prisma.categoria.create({
    data: { nombre: "Salarios", tipo: "EGRESO" },
  });
  const catProveedores = await prisma.categoria.create({
    data: { nombre: "Proveedores", tipo: "EGRESO" },
  });
  const catServicios = await prisma.categoria.create({
    data: { nombre: "Servicios (luz, agua, internet)", tipo: "EGRESO" },
  });
  const catMarketing = await prisma.categoria.create({
    data: { nombre: "Marketing", tipo: "EGRESO" },
  });
  await prisma.categoria.createMany({
    data: [
      { nombre: "Publicidad redes sociales", tipo: "EGRESO", parentId: catMarketing.id },
      { nombre: "Influencers / colaboraciones", tipo: "EGRESO", parentId: catMarketing.id },
      { nombre: "Material gráfico / impresiones", tipo: "EGRESO", parentId: catMarketing.id },
    ],
  });
  const catInventarioCompras = await prisma.categoria.create({
    data: { nombre: "Compras de inventario", tipo: "EGRESO" },
  });
  const catRemodelacion = await prisma.categoria.create({
    data: { nombre: "Remodelaciones", tipo: "EGRESO" },
  });

  // ---------- CAJAS ----------
  const cajaChica = await prisma.caja.upsert({
    where: { tipo: "CHICA" },
    update: {},
    create: { nombre: "Caja Chica (Operativa)", tipo: "CHICA", saldoActual: 1500 },
  });
  const cajaGrande = await prisma.caja.upsert({
    where: { tipo: "GRANDE" },
    update: {},
    create: { nombre: "Caja Grande (Principal)", tipo: "GRANDE", saldoActual: 42000 },
  });

  // Movimiento inicial de apertura para que el historial no arranque vacío
  await prisma.movimientoCaja.createMany({
    data: [
      {
        cajaId: cajaChica.id,
        tipo: "INGRESO",
        monto: 1500,
        saldoAnterior: 0,
        saldoNuevo: 1500,
        descripcion: "Apertura de caja chica",
        usuarioId: admin.id,
      },
      {
        cajaId: cajaGrande.id,
        tipo: "INGRESO",
        monto: 42000,
        saldoAnterior: 0,
        saldoNuevo: 42000,
        descripcion: "Saldo inicial migrado desde Excel",
        usuarioId: admin.id,
      },
    ],
  });

  // ---------- PRESUPUESTO DE MARKETING (el caso puntual del cliente) ----------
  const hoy = new Date();
  await prisma.presupuesto.create({
    data: {
      categoriaId: catMarketing.id,
      nombre: `Marketing - ${hoy.getMonth() + 1}/${hoy.getFullYear()}`,
      montoAsignado: 8250,
      periodoMes: hoy.getMonth() + 1,
      periodoAnio: hoy.getFullYear(),
      umbralAlerta: 80,
    },
  });
  await prisma.presupuesto.create({
    data: {
      categoriaId: catSalarios.id,
      nombre: `Salarios - ${hoy.getMonth() + 1}/${hoy.getFullYear()}`,
      montoAsignado: 18000,
      periodoMes: hoy.getMonth() + 1,
      periodoAnio: hoy.getFullYear(),
      umbralAlerta: 90,
    },
  });

  // ---------- INVENTARIO ----------
  await prisma.inventarioItem.createMany({
    data: [
      { nombre: "Vacuna refuerzo metabólico", categoria: "Vacunas", unidadMedida: "dosis", stockActual: 8, stockMinimo: 10, fechaVencimiento: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 15) },
      { nombre: "Suplemento quemador L-Carnitina", categoria: "Suplementos", unidadMedida: "frasco", stockActual: 22, stockMinimo: 15 },
      { nombre: "Jeringas descartables 3ml", categoria: "Insumos médicos", unidadMedida: "caja", stockActual: 4, stockMinimo: 5 },
      { nombre: "Alcohol antiséptico", categoria: "Insumos médicos", unidadMedida: "litro", stockActual: 12, stockMinimo: 6 },
    ],
  });

  // ---------- TRANSACCIONES DE EJEMPLO (últimos ~2 meses) ----------
  const catsIngreso = await prisma.categoria.findMany({ where: { tipo: "INGRESO", parentId: { not: null } } });
  const catsEgreso = [catSalarios, catProveedores, catServicios, catMarketing, catInventarioCompras];

  const transacciones = [];
  for (let i = 0; i < 45; i++) {
    const dias = Math.floor(Math.random() * 60);
    const fecha = new Date(hoy.getTime() - dias * 24 * 3600 * 1000);
    const esIngreso = Math.random() > 0.35;
    if (esIngreso) {
      const cat = catsIngreso[Math.floor(Math.random() * catsIngreso.length)];
      transacciones.push({
        tipo: "INGRESO" as const,
        monto: Math.round((300 + Math.random() * 1200) * 100) / 100,
        fecha,
        categoriaId: cat.id,
        descripcion: "Pago de paciente - " + cat.nombre,
        metodoPago: ["EFECTIVO", "TARJETA", "TRANSFERENCIA", "YAPE_PLIN"][Math.floor(Math.random() * 4)] as any,
        usuarioId: admin.id,
      });
    } else {
      const cat = catsEgreso[Math.floor(Math.random() * catsEgreso.length)];
      transacciones.push({
        tipo: "EGRESO" as const,
        monto: Math.round((80 + Math.random() * 900) * 100) / 100,
        fecha,
        categoriaId: cat.id,
        descripcion: "Gasto - " + cat.nombre,
        metodoPago: "TRANSFERENCIA" as const,
        usuarioId: gerente.id,
      });
    }
  }
  for (const t of transacciones) {
    await prisma.transaccion.create({ data: t });
  }

  // ---------- SOLICITUDES DE COMPRA ----------
  const logistica = await prisma.usuario.findUnique({ where: { email: "logistica@policlinico.pe" } });
  await prisma.solicitudCompra.create({
    data: {
      codigo: "SC-2026-0001",
      area: "Logística",
      justificacion: "Reposición de jeringas descartables, stock por debajo del mínimo.",
      montoEstimado: 450,
      estado: "PENDIENTE",
      solicitanteId: logistica!.id,
      items: {
        create: [
          { descripcion: "Jeringas descartables 3ml (caja x100)", cantidad: 5, precioEstimado: 90 },
        ],
      },
    },
  });
  await prisma.solicitudCompra.create({
    data: {
      codigo: "SC-2026-0002",
      area: "Marketing",
      justificacion: "Impresión de material gráfico para campaña de verano.",
      montoEstimado: 620,
      estado: "APROBADA",
      solicitanteId: gerente.id,
      aprobadorId: admin.id,
      fechaResolucion: new Date(),
      comentarioResolucion: "Aprobado dentro de presupuesto de marketing.",
      items: {
        create: [
          { descripcion: "Banners y volantes", cantidad: 1, precioEstimado: 620 },
        ],
      },
    },
  });

  // ---------- BIODATA DEL DOCTOR (últimos 14 días, para poblar el gráfico) ----------
  let pesoBase = 78.5;
  const alturaCm = 175;
  for (let i = 13; i >= 0; i--) {
    const fecha = new Date(hoy.getTime() - i * 24 * 3600 * 1000);
    pesoBase += (Math.random() - 0.55) * 0.3; // leve tendencia a la baja
    const pesoKg = Math.round(pesoBase * 10) / 10;
    const alturaM = alturaCm / 100;
    await prisma.metricaSalud.create({
      data: {
        usuarioId: doctor.id,
        fecha,
        pesoKg,
        alturaCm,
        imc: Math.round((pesoKg / (alturaM * alturaM)) * 10) / 10,
        presionSistolica: 110 + Math.floor(Math.random() * 15),
        presionDiastolica: 70 + Math.floor(Math.random() * 10),
      },
    });
  }

  console.log("Seed completado.");
  console.log("Usuarios de prueba (password para todos: policlinico2026):");
  console.log("  admin@policlinico.pe          -> Administrador");
  console.log("  gerencia@policlinico.pe       -> Gerente");
  console.log("  logistica@policlinico.pe      -> Logística");
  console.log("  contabilidad@policlinico.pe   -> Contador (solo lectura)");
  console.log("  doctor@policlinico.pe         -> Doctor (biodata)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
