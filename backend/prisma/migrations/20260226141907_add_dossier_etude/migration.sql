-- CreateTable
CREATE TABLE "dossier_etudes" (
    "id" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "code_oeie" TEXT NOT NULL,
    "dre" TIMESTAMP(3),
    "dre_valeur" TEXT,
    "etat" TEXT,
    "poi" TEXT,
    "sj" TEXT,
    "caff" TEXT,
    "memo_chaf" TEXT,
    "ville" TEXT,
    "adresse" TEXT,
    "date_vt" TIMESTAMP(3),
    "commentaires" TEXT,
    "ctc" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dossier_etudes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dossier_etudes_secteur_idx" ON "dossier_etudes"("secteur");

-- CreateIndex
CREATE INDEX "dossier_etudes_etat_idx" ON "dossier_etudes"("etat");

-- CreateIndex
CREATE INDEX "dossier_etudes_code_oeie_idx" ON "dossier_etudes"("code_oeie");
