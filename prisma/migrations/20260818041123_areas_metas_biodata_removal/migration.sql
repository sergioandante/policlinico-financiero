-- DropForeignKey
ALTER TABLE "metricas_salud" DROP CONSTRAINT "metricas_salud_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "presupuestos" DROP CONSTRAINT "presupuestos_categoriaId_fkey";

-- DropIndex
DROP INDEX "presupuestos_categoriaId_periodoMes_periodoAnio_key";

-- AlterTable
ALTER TABLE "categorias" ADD COLUMN     "esFijo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "inventario_items" ADD COLUMN     "codigo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "presupuestos" DROP COLUMN "categoriaId",
ADD COLUMN     "areaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "solicitudes_compra" DROP COLUMN "area",
ADD COLUMN     "areaId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "transacciones" ADD COLUMN     "areaId" TEXT;

-- DropTable
DROP TABLE "metricas_salud";

-- CreateTable
CREATE TABLE "areas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metas_financieras" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "montoObjetivo" DECIMAL(65,30) NOT NULL,
    "areaId" TEXT,
    "periodoMes" INTEGER NOT NULL,
    "periodoAnio" INTEGER NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metas_financieras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_nombre_key" ON "areas"("nombre");

-- CreateIndex
CREATE INDEX "metas_financieras_periodoMes_periodoAnio_idx" ON "metas_financieras"("periodoMes", "periodoAnio");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_items_codigo_key" ON "inventario_items"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "presupuestos_areaId_periodoMes_periodoAnio_key" ON "presupuestos"("areaId", "periodoMes", "periodoAnio");

-- CreateIndex
CREATE INDEX "transacciones_areaId_idx" ON "transacciones"("areaId");

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presupuestos" ADD CONSTRAINT "presupuestos_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metas_financieras" ADD CONSTRAINT "metas_financieras_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_compra" ADD CONSTRAINT "solicitudes_compra_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

