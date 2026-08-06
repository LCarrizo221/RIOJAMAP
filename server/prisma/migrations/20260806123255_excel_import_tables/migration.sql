-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "table_name_alias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expedientes" (
    "id" SERIAL NOT NULL,
    "expediente" TEXT NOT NULL,
    "nombre" TEXT,
    "referente" TEXT,
    "detalle" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expedientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConveniosMunic" (
    "id" SERIAL NOT NULL,
    "expediente" TEXT NOT NULL,
    "nombre" TEXT,
    "referente" TEXT,
    "detalle" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConveniosMunic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeudasEXPTES" (
    "id" SERIAL NOT NULL,
    "expediente" TEXT NOT NULL,
    "nombre" TEXT,
    "referente" TEXT,
    "detalle" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeudasEXPTES_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instituciones" (
    "id" SERIAL NOT NULL,
    "expediente" TEXT NOT NULL,
    "nombre" TEXT,
    "referente" TEXT,
    "detalle" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instituciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intendentes026" (
    "id" SERIAL NOT NULL,
    "expediente" TEXT NOT NULL,
    "nombre" TEXT,
    "referente" TEXT,
    "detalle" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intendentes026_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diputados" (
    "id" SERIAL NOT NULL,
    "expediente" TEXT NOT NULL,
    "nombre" TEXT,
    "referente" TEXT,
    "detalle" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diputados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiniHerrera" (
    "id" SERIAL NOT NULL,
    "expediente" TEXT NOT NULL,
    "nombre" TEXT,
    "referente" TEXT,
    "detalle" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
    "person_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PiniHerrera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GabiPedrali" (
    "id" SERIAL NOT NULL,
    "expediente" TEXT NOT NULL,
    "nombre" TEXT,
    "referente" TEXT,
    "detalle" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
    "person_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GabiPedrali_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeresitaMadera" (
    "id" SERIAL NOT NULL,
    "expediente" TEXT NOT NULL,
    "nombre" TEXT,
    "referente" TEXT,
    "detalle" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
    "person_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeresitaMadera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlorenciaLopez" (
    "id" SERIAL NOT NULL,
    "expediente" TEXT NOT NULL,
    "nombre" TEXT,
    "referente" TEXT,
    "detalle" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
    "person_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlorenciaLopez_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuryCaceres" (
    "id" SERIAL NOT NULL,
    "expediente" TEXT NOT NULL,
    "nombre" TEXT,
    "referente" TEXT,
    "detalle" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
    "person_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuryCaceres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dirigentes" (
    "id" SERIAL NOT NULL,
    "expediente" TEXT NOT NULL,
    "nombre" TEXT,
    "referente" TEXT,
    "detalle" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
    "person_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dirigentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Romina" (
    "id" SERIAL NOT NULL,
    "expediente" TEXT NOT NULL,
    "nombre" TEXT,
    "referente" TEXT,
    "detalle" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
    "person_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Romina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Misael" (
    "id" SERIAL NOT NULL,
    "expediente" TEXT NOT NULL,
    "nombre" TEXT,
    "referente" TEXT,
    "detalle" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "imported_from" TEXT NOT NULL DEFAULT 'INFORME_DIARIO',
    "person_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Misael_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportesHistorico" (
    "id" SERIAL NOT NULL,
    "fecha_importacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expediente" TEXT,
    "nombre" TEXT,
    "referente" TEXT,
    "monto_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monto_parcial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "import_source_file" TEXT,
    "matched_table_type" TEXT,
    "matched_table_name" TEXT,
    "matched_by_expediente" BOOLEAN NOT NULL DEFAULT false,
    "matched_by_name" BOOLEAN NOT NULL DEFAULT false,
    "version_created" INTEGER,
    "warnings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportesHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_table_name_alias_key" ON "Person"("table_name_alias");

-- CreateIndex
CREATE UNIQUE INDEX "Expedientes_expediente_key" ON "Expedientes"("expediente");

-- CreateIndex
CREATE INDEX "Expedientes_expediente_idx" ON "Expedientes"("expediente");

-- CreateIndex
CREATE INDEX "Expedientes_version_idx" ON "Expedientes"("version");

-- CreateIndex
CREATE INDEX "Expedientes_createdAt_idx" ON "Expedientes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConveniosMunic_expediente_key" ON "ConveniosMunic"("expediente");

-- CreateIndex
CREATE INDEX "ConveniosMunic_expediente_idx" ON "ConveniosMunic"("expediente");

-- CreateIndex
CREATE INDEX "ConveniosMunic_version_idx" ON "ConveniosMunic"("version");

-- CreateIndex
CREATE UNIQUE INDEX "DeudasEXPTES_expediente_key" ON "DeudasEXPTES"("expediente");

-- CreateIndex
CREATE INDEX "DeudasEXPTES_expediente_idx" ON "DeudasEXPTES"("expediente");

-- CreateIndex
CREATE INDEX "DeudasEXPTES_version_idx" ON "DeudasEXPTES"("version");

-- CreateIndex
CREATE UNIQUE INDEX "Instituciones_expediente_key" ON "Instituciones"("expediente");

-- CreateIndex
CREATE INDEX "Instituciones_expediente_idx" ON "Instituciones"("expediente");

-- CreateIndex
CREATE INDEX "Instituciones_version_idx" ON "Instituciones"("version");

-- CreateIndex
CREATE UNIQUE INDEX "Intendentes026_expediente_key" ON "Intendentes026"("expediente");

-- CreateIndex
CREATE INDEX "Intendentes026_expediente_idx" ON "Intendentes026"("expediente");

-- CreateIndex
CREATE INDEX "Intendentes026_version_idx" ON "Intendentes026"("version");

-- CreateIndex
CREATE UNIQUE INDEX "Diputados_expediente_key" ON "Diputados"("expediente");

-- CreateIndex
CREATE INDEX "Diputados_expediente_idx" ON "Diputados"("expediente");

-- CreateIndex
CREATE INDEX "Diputados_version_idx" ON "Diputados"("version");

-- CreateIndex
CREATE INDEX "PiniHerrera_expediente_idx" ON "PiniHerrera"("expediente");

-- CreateIndex
CREATE INDEX "PiniHerrera_person_id_idx" ON "PiniHerrera"("person_id");

-- CreateIndex
CREATE INDEX "PiniHerrera_version_idx" ON "PiniHerrera"("version");

-- CreateIndex
CREATE UNIQUE INDEX "PiniHerrera_expediente_person_id_createdAt_key" ON "PiniHerrera"("expediente", "person_id", "createdAt");

-- CreateIndex
CREATE INDEX "GabiPedrali_expediente_idx" ON "GabiPedrali"("expediente");

-- CreateIndex
CREATE INDEX "GabiPedrali_person_id_idx" ON "GabiPedrali"("person_id");

-- CreateIndex
CREATE INDEX "GabiPedrali_version_idx" ON "GabiPedrali"("version");

-- CreateIndex
CREATE UNIQUE INDEX "GabiPedrali_expediente_person_id_createdAt_key" ON "GabiPedrali"("expediente", "person_id", "createdAt");

-- CreateIndex
CREATE INDEX "TeresitaMadera_expediente_idx" ON "TeresitaMadera"("expediente");

-- CreateIndex
CREATE INDEX "TeresitaMadera_person_id_idx" ON "TeresitaMadera"("person_id");

-- CreateIndex
CREATE INDEX "TeresitaMadera_version_idx" ON "TeresitaMadera"("version");

-- CreateIndex
CREATE UNIQUE INDEX "TeresitaMadera_expediente_person_id_createdAt_key" ON "TeresitaMadera"("expediente", "person_id", "createdAt");

-- CreateIndex
CREATE INDEX "FlorenciaLopez_expediente_idx" ON "FlorenciaLopez"("expediente");

-- CreateIndex
CREATE INDEX "FlorenciaLopez_person_id_idx" ON "FlorenciaLopez"("person_id");

-- CreateIndex
CREATE INDEX "FlorenciaLopez_version_idx" ON "FlorenciaLopez"("version");

-- CreateIndex
CREATE UNIQUE INDEX "FlorenciaLopez_expediente_person_id_createdAt_key" ON "FlorenciaLopez"("expediente", "person_id", "createdAt");

-- CreateIndex
CREATE INDEX "GuryCaceres_expediente_idx" ON "GuryCaceres"("expediente");

-- CreateIndex
CREATE INDEX "GuryCaceres_person_id_idx" ON "GuryCaceres"("person_id");

-- CreateIndex
CREATE INDEX "GuryCaceres_version_idx" ON "GuryCaceres"("version");

-- CreateIndex
CREATE UNIQUE INDEX "GuryCaceres_expediente_person_id_createdAt_key" ON "GuryCaceres"("expediente", "person_id", "createdAt");

-- CreateIndex
CREATE INDEX "Dirigentes_expediente_idx" ON "Dirigentes"("expediente");

-- CreateIndex
CREATE INDEX "Dirigentes_person_id_idx" ON "Dirigentes"("person_id");

-- CreateIndex
CREATE INDEX "Dirigentes_version_idx" ON "Dirigentes"("version");

-- CreateIndex
CREATE UNIQUE INDEX "Dirigentes_expediente_person_id_createdAt_key" ON "Dirigentes"("expediente", "person_id", "createdAt");

-- CreateIndex
CREATE INDEX "Romina_expediente_idx" ON "Romina"("expediente");

-- CreateIndex
CREATE INDEX "Romina_person_id_idx" ON "Romina"("person_id");

-- CreateIndex
CREATE INDEX "Romina_version_idx" ON "Romina"("version");

-- CreateIndex
CREATE UNIQUE INDEX "Romina_expediente_person_id_createdAt_key" ON "Romina"("expediente", "person_id", "createdAt");

-- CreateIndex
CREATE INDEX "Misael_expediente_idx" ON "Misael"("expediente");

-- CreateIndex
CREATE INDEX "Misael_person_id_idx" ON "Misael"("person_id");

-- CreateIndex
CREATE INDEX "Misael_version_idx" ON "Misael"("version");

-- CreateIndex
CREATE UNIQUE INDEX "Misael_expediente_person_id_createdAt_key" ON "Misael"("expediente", "person_id", "createdAt");

-- CreateIndex
CREATE INDEX "ReportesHistorico_fecha_importacion_idx" ON "ReportesHistorico"("fecha_importacion");

-- CreateIndex
CREATE INDEX "ReportesHistorico_expediente_idx" ON "ReportesHistorico"("expediente");

-- CreateIndex
CREATE INDEX "ReportesHistorico_matched_table_type_idx" ON "ReportesHistorico"("matched_table_type");

-- CreateIndex
CREATE INDEX "ReportesHistorico_matched_by_expediente_idx" ON "ReportesHistorico"("matched_by_expediente");

-- CreateIndex
CREATE INDEX "ReportesHistorico_matched_by_name_idx" ON "ReportesHistorico"("matched_by_name");

-- AddForeignKey
ALTER TABLE "PiniHerrera" ADD CONSTRAINT "PiniHerrera_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GabiPedrali" ADD CONSTRAINT "GabiPedrali_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeresitaMadera" ADD CONSTRAINT "TeresitaMadera_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlorenciaLopez" ADD CONSTRAINT "FlorenciaLopez_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuryCaceres" ADD CONSTRAINT "GuryCaceres_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dirigentes" ADD CONSTRAINT "Dirigentes_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Romina" ADD CONSTRAINT "Romina_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Misael" ADD CONSTRAINT "Misael_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
