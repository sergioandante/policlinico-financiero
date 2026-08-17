-- AlterTable
ALTER TABLE "transacciones" ADD COLUMN     "area" TEXT,
ADD COLUMN     "posiblePagoMultiple" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subclaseBP" TEXT;

-- CreateIndex
CREATE INDEX "transacciones_area_fecha_idx" ON "transacciones"("area", "fecha");
