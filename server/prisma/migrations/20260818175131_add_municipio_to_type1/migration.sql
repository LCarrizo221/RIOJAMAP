-- AlterTable
ALTER TABLE "ConveniosMunic" ADD COLUMN     "municipio" TEXT;

-- AlterTable
ALTER TABLE "DeudasEXPTES" ADD COLUMN     "municipio" TEXT;

-- AlterTable
ALTER TABLE "Diputados" ADD COLUMN     "municipio" TEXT;

-- AlterTable
ALTER TABLE "Expedientes" ADD COLUMN     "municipio" TEXT;

-- AlterTable
ALTER TABLE "Instituciones" ADD COLUMN     "municipio" TEXT;

-- AlterTable
ALTER TABLE "Intendentes026" ADD COLUMN     "municipio" TEXT;

-- CreateIndex
CREATE INDEX "ConveniosMunic_municipio_idx" ON "ConveniosMunic"("municipio");
