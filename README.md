# Módulo Financiero y Administrativo — Policlínico San Damián

Sistema web para que la administradora del Policlínico San Damián lleve el
control financiero completo del negocio: ingresos y gastos, cajas,
presupuesto por área, proyecciones, inventario, solicitudes de compra entre
áreas y metas económicas. **No incluye módulo clínico ni pacientes/doctores**
(historias clínicas, agenda de citas, etc. quedan fuera de este alcance).

## Stack técnico

| Pieza | Elección | Motivo |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server Components + Server Actions reducen boilerplate de API |
| UI | Tailwind + shadcn/ui (Radix) | Look profesional, accesible por defecto |
| Base de datos | **PostgreSQL** (Supabase) vía Prisma | Producción real, con `directUrl` para migraciones |
| Auth | **NextAuth (Auth.js) v5** con credenciales propias | No depende de crear cuenta en un proveedor externo |
| Gráficos | Recharts | Maduro, liviano, se integra bien con Tailwind |
| Excel | SheetJS (`xlsx`) | Importar y exportar datos en el navegador, sin backend adicional |

## Estructura del proyecto

```
policlinico-financiero/
├── prisma/
│   ├── schema.prisma        # Modelo de datos completo
│   └── seed.ts               # Áreas, usuarios, cajas, categorías, datos de ejemplo
├── src/
│   ├── app/
│   │   ├── login/                        # Login
│   │   ├── (dashboard)/                  # Layout protegido con sidebar
│   │   │   ├── dashboard/                # KPIs, reporte del día, resumen de cajas, anomalías
│   │   │   ├── transacciones/            # Listado, form, importar/exportar Excel
│   │   │   ├── cajas/                    # Caja Chica/Grande, movimientos, traspasos
│   │   │   ├── areas/                    # Rentabilidad por área (ingreso - egreso)
│   │   │   ├── presupuestos/             # Presupuestos por área
│   │   │   ├── proyecciones/             # Proyección de ingresos/egresos futuros
│   │   │   ├── metas/                    # Metas económicas (ingreso, ahorro, tope de gasto)
│   │   │   ├── inventario/               # Stock, alertas de vencimiento
│   │   │   ├── compras/                  # Solicitudes de compra entre áreas
│   │   │   └── usuarios/                 # Gestión de usuarios (solo Admin)
│   │   └── api/
│   │       ├── auth/[...nextauth]/       # NextAuth
│   │       └── transacciones/importar/   # Recibe filas parseadas del Excel
│   ├── components/
│   │   ├── ui/            # shadcn/ui (button, card, dialog, select, table...)
│   │   ├── dashboard/, cajas/, areas/, transacciones/
│   │   ├── presupuestos/, proyecciones/, metas/, inventario/, compras/, usuarios/
│   │   ├── shared/         # Botón de exportar a Excel (reusado en varias pantallas)
│   │   └── layout/         # Sidebar, header
│   ├── lib/
│   │   ├── auth.ts         # Config NextAuth
│   │   ├── permisos.ts     # Matriz de permisos por rol (fuente única de verdad)
│   │   ├── prisma.ts       # Cliente Prisma
│   │   ├── actions/        # Server Actions (mutaciones)
│   │   └── consultas/      # Queries de lectura (Server Components)
│   └── middleware.ts       # Protección de rutas por sesión
└── package.json
```

## Instrucciones para correr el proyecto localmente

### 1. Requisitos previos
- Node.js 20+ y npm 10+
- Una base de datos PostgreSQL (local o Supabase)

### 2. Instalar dependencias

```bash
cd policlinico-financiero
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Completa `DATABASE_URL` y `DIRECT_URL` con tu cadena de conexión de
PostgreSQL/Supabase, y genera un secreto para NextAuth:

```bash
openssl rand -base64 32
```

### 4. Crear la base de datos y cargar datos de ejemplo

```bash
npm run db:generate   # genera el cliente Prisma
npm run db:migrate    # crea las tablas a partir del schema
npm run db:seed       # carga áreas, usuarios, cajas, categorías, datos de ejemplo
```

### 5. Levantar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — te redirige a `/login`.

### 6. Usuarios de prueba (creados por el seed)

| Correo | Rol | Contraseña |
|---|---|---|
| admin@policlinico.pe | Administrador | policlinico2026 |
| gerencia@policlinico.pe | Gerente | policlinico2026 |
| logistica@policlinico.pe | Logística | policlinico2026 |
| contabilidad@policlinico.pe | Contador (solo lectura) | policlinico2026 |

### 7. Formato del Excel para importar/exportar transacciones

Columnas (en `/transacciones/importar`):

| Fecha | Tipo | Categoria | Area (opcional) | Monto | Descripcion | MetodoPago (opcional) |
|---|---|---|---|---|---|---|
| 2026-08-01 | Ingreso | Programa Pérdida de Peso - Premium | Baja de Peso | 850 | Pago paciente Juan Pérez | Transferencia |

- `Tipo` acepta "Ingreso"/"Egreso" (sin distinguir mayúsculas/tildes).
- `Categoria` debe coincidir con el **nombre exacto** de una categoría ya
  configurada (el importador muestra qué filas no encontraron match antes
  de guardar nada).
- `Area` es opcional; si se incluye, debe coincidir con el nombre de una
  de las áreas configuradas.
- El botón **Exportar Excel** en Transacciones, Cajas e Inventario genera
  un `.xlsx` con las columnas equivalentes, listo para reimportar o
  compartir con contabilidad.

### Comandos útiles adicionales

```bash
npm run db:studio   # Explorador visual de la base de datos (Prisma Studio)
npm run db:reset    # Borra todo y vuelve a correr migraciones + seed
npm run build        # Build de producción
```

## Decisiones de diseño relevantes para el cliente

1. **Todo movimiento de caja pasa por `prisma.$transaction`.** Un traspaso
   entre Caja Chica y Caja Grande genera *dos* filas ligadas (salida +
   entrada) de forma atómica: si algo falla, no queda una caja descuadrada.
2. **El saldo de cada caja es un campo denormalizado** (`Caja.saldoActual`)
   que se actualiza en cada movimiento, pero el historial completo en
   `MovimientoCaja` permite auditar y reconstruir el saldo en cualquier
   fecha si hiciera falta.
3. **Área es el nivel de negocio, categoría es el nivel contable.** Cada
   transacción se etiqueta con un `Area` (Cardiología, Laboratorio,
   RRHH...) y con una `Categoria` (Salarios, Proveedores...). El
   presupuesto y la rentabilidad se miden por área; la categoría sirve
   para el detalle contable y para separar gasto Fijo de Variable.
4. **Los roles controlan tanto la navegación como las Server Actions.**
   La matriz vive en un solo archivo (`lib/permisos.ts`), así que agregar un
   rol nuevo o cambiar qué puede hacer "Logística" es un cambio en un solo
   lugar, no en cada pantalla.
5. **Detección de anomalías v1** compara cada egreso contra el promedio
   histórico de su categoría (bandera si supera 2.5x). Es una heurística
   simple a propósito, igual que la **proyección de ingresos/egresos**
   (promedio móvil de 3 meses + tendencia lineal simple): dan valor de
   inmediato y son perfeccionables con series de tiempo más adelante.
6. **Las metas económicas** (`MetaFinanciera`) admiten tres tipos: ingreso
   mensual objetivo, ahorro (utilidad) objetivo, o tope de gasto por área
   — cada una se compara contra lo real del mes en curso.

## Roles y permisos (resumen)

| Módulo | Administrador | Gerente | Logística | Contador |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | — | ✅ (solo lectura) |
| Transacciones | ✅ | ✅ | — | ✅ (solo lectura) |
| Importar Excel | ✅ | ✅ | — | — |
| Exportar Excel | ✅ | ✅ | ✅ | ✅ |
| Control de Cajas | ✅ | ✅ | — | ✅ (solo lectura) |
| Áreas | ✅ (edita) | ✅ (lectura) | — | ✅ (lectura) |
| Presupuestos | ✅ | ✅ | — | ✅ (solo lectura) |
| Proyecciones | ✅ | ✅ | — | ✅ (solo lectura) |
| Metas Económicas | ✅ | ✅ | — | ✅ (solo lectura) |
| Inventario | ✅ | ✅ (lectura) | ✅ | — |
| Solicitudes de Compra | ✅ (crea y aprueba) | ✅ (crea y aprueba) | ✅ (solo crea) | — |
| Usuarios | ✅ | — | — | — |

## Áreas configuradas (seed)

Traumatología, Cardiología, Pediatría, Baja de Peso, Odontología,
Laboratorio, Medicina General, Ginecología, Medicina Estética
(clínicas) · Ventas/Comercial, RRHH, Logística, Recepción, Administrativa,
Limpieza (administrativas). Se pueden agregar más desde `/areas`.

## Posibles siguientes pasos

1. **Módulo clínico** (pacientes, doctores, historias clínicas, agenda de
   citas) si el cliente decide ampliar el alcance más adelante.
2. **Vincular Inventario con consumo por área**: descontar stock
   automáticamente cuando un área use un insumo, en vez del ajuste manual
   actual.
3. **Notificaciones** por correo/WhatsApp cuando un presupuesto se acerque
   al límite, una meta esté en riesgo, o el stock de un insumo esté por
   agotarse.
4. **Proyección más fina**: reemplazar el promedio móvil simple por un
   modelo estacional una vez haya más histórico acumulado.
