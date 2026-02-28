-- CreateTable
CREATE TABLE "suivi_etudes" (
    "id" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "nb_dossiers" INTEGER NOT NULL DEFAULT 0,
    "dre_ko" INTEGER NOT NULL DEFAULT 0,
    "vt_a_faire" INTEGER NOT NULL DEFAULT 0,
    "a_remonter" INTEGER NOT NULL DEFAULT 0,
    "retour_vt" INTEGER NOT NULL DEFAULT 0,
    "doss_a_reprendre" INTEGER NOT NULL DEFAULT 0,
    "doss_a_monter" INTEGER NOT NULL DEFAULT 0,
    "att_infos_caf_ref" INTEGER NOT NULL DEFAULT 0,
    "att_devis_orange_rip" INTEGER NOT NULL DEFAULT 0,
    "att_devis_client" INTEGER NOT NULL DEFAULT 0,
    "att_travaux_client" INTEGER NOT NULL DEFAULT 0,
    "att_pv" INTEGER NOT NULL DEFAULT 0,
    "att_dta" INTEGER NOT NULL DEFAULT 0,
    "att_comac_cafft" INTEGER NOT NULL DEFAULT 0,
    "att_maj_si" INTEGER NOT NULL DEFAULT 0,
    "poi_en_travaux" INTEGER NOT NULL DEFAULT 0,
    "at_retour_doe" INTEGER NOT NULL DEFAULT 0,
    "recol_a_faire" INTEGER NOT NULL DEFAULT 0,
    "etat_5" INTEGER NOT NULL DEFAULT 0,
    "dossier_main_be" INTEGER NOT NULL DEFAULT 0,
    "dossier_main_chaff" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suivi_etudes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suivi_etudes_secteur_key" ON "suivi_etudes"("secteur");
