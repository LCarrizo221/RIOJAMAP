-- AlterTable
ALTER TABLE "ConveniosMunic" ADD COLUMN     "es_eventual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_carga" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DeudasEXPTES" ADD COLUMN     "es_eventual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_carga" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Diputados" ADD COLUMN     "es_eventual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_carga" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Dirigentes" ADD COLUMN     "es_eventual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_carga" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Expedientes" ADD COLUMN     "es_eventual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_carga" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FlorenciaLopez" ADD COLUMN     "es_eventual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_carga" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "GabiPedrali" ADD COLUMN     "es_eventual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_carga" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "GuryCaceres" ADD COLUMN     "es_eventual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_carga" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Instituciones" ADD COLUMN     "es_eventual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_carga" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Intendentes026" ADD COLUMN     "es_eventual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_carga" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Misael" ADD COLUMN     "es_eventual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_carga" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PiniHerrera" ADD COLUMN     "es_eventual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_carga" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Romina" ADD COLUMN     "es_eventual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_carga" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TeresitaMadera" ADD COLUMN     "es_eventual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fecha_carga" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Dirigentes_es_eventual_idx" ON "Dirigentes"("es_eventual");

-- CreateIndex
CREATE INDEX "Dirigentes_fecha_carga_idx" ON "Dirigentes"("fecha_carga");

-- CreateIndex
CREATE INDEX "FlorenciaLopez_es_eventual_idx" ON "FlorenciaLopez"("es_eventual");

-- CreateIndex
CREATE INDEX "FlorenciaLopez_fecha_carga_idx" ON "FlorenciaLopez"("fecha_carga");

-- CreateIndex
CREATE INDEX "GabiPedrali_es_eventual_idx" ON "GabiPedrali"("es_eventual");

-- CreateIndex
CREATE INDEX "GabiPedrali_fecha_carga_idx" ON "GabiPedrali"("fecha_carga");

-- CreateIndex
CREATE INDEX "GuryCaceres_es_eventual_idx" ON "GuryCaceres"("es_eventual");

-- CreateIndex
CREATE INDEX "GuryCaceres_fecha_carga_idx" ON "GuryCaceres"("fecha_carga");

-- CreateIndex
CREATE INDEX "Misael_es_eventual_idx" ON "Misael"("es_eventual");

-- CreateIndex
CREATE INDEX "Misael_fecha_carga_idx" ON "Misael"("fecha_carga");

-- CreateIndex
CREATE INDEX "PiniHerrera_es_eventual_idx" ON "PiniHerrera"("es_eventual");

-- CreateIndex
CREATE INDEX "PiniHerrera_fecha_carga_idx" ON "PiniHerrera"("fecha_carga");

-- CreateIndex
CREATE INDEX "Romina_es_eventual_idx" ON "Romina"("es_eventual");

-- CreateIndex
CREATE INDEX "Romina_fecha_carga_idx" ON "Romina"("fecha_carga");

-- CreateIndex
CREATE INDEX "TeresitaMadera_es_eventual_idx" ON "TeresitaMadera"("es_eventual");

-- CreateIndex
CREATE INDEX "TeresitaMadera_fecha_carga_idx" ON "TeresitaMadera"("fecha_carga");
