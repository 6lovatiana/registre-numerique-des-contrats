-- Registre des contrats et workflow de litiges (PostgreSQL).
CREATE TABLE IF NOT EXISTS contrats (
    id TEXT PRIMARY KEY,
    reference VARCHAR(100) NOT NULL UNIQUE,
    criticality VARCHAR(40),
    fournisseur VARCHAR(255) NOT NULL,
    donnees JSONB NOT NULL,
    date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents_contrats (
    id BIGSERIAL PRIMARY KEY,
    contrat_id TEXT NOT NULL REFERENCES contrats(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    type_document VARCHAR(20) NOT NULL CHECK (type_document IN ('Contrat','Avenant','CGV')),
    type_mime VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    contenu BYTEA NOT NULL,
    date_ajout TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS litiges (
    id BIGSERIAL PRIMARY KEY,
    reference_litige VARCHAR(13) NOT NULL UNIQUE CHECK (reference_litige ~ '^LIT-[0-9]{4}-[0-9]{4}$'),
    contrat_id TEXT NOT NULL REFERENCES contrats(id) ON DELETE RESTRICT,
    type_litige VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    montant_concerne NUMERIC(14,2) NOT NULL CHECK (montant_concerne >= 0),
    statut VARCHAR(40) NOT NULL DEFAULT 'Nouveau',
    priorite VARCHAR(10) NOT NULL DEFAULT 'Normale' CHECK (priorite IN ('Normale','Haute')),
    escalation_dg BOOLEAN NOT NULL DEFAULT FALSE,
    montant_avoir_facture_corrigee NUMERIC(14,2) CHECK (montant_avoir_facture_corrigee >= 0),
    date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date_modification TIMESTAMPTZ,
    id_utilisateur_action VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS historique_statuts_litiges (
    id BIGSERIAL PRIMARY KEY,
    litige_id BIGINT NOT NULL REFERENCES litiges(id) ON DELETE CASCADE,
    ancien_statut VARCHAR(40),
    nouveau_statut VARCHAR(40) NOT NULL,
    horodatage TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_utilisateur_action VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS actions_contrats (
    id BIGSERIAL PRIMARY KEY,
    contrat_id TEXT NOT NULL REFERENCES contrats(id) ON DELETE CASCADE,
    action VARCHAR(40) NOT NULL,
    date_action TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    id_utilisateur VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    contrat_id TEXT NOT NULL REFERENCES contrats(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    contexte TEXT NOT NULL DEFAULT '',
    montant NUMERIC(14,2) NOT NULL DEFAULT 0,
    date_limite DATE,
    statut VARCHAR(20) NOT NULL DEFAULT 'En attente'
);

CREATE OR REPLACE FUNCTION journaliser_changement_statut_litige()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO historique_statuts_litiges(litige_id, ancien_statut, nouveau_statut, horodatage, id_utilisateur_action)
    VALUES (NEW.id, NULL, NEW.statut, NEW.date_creation, NEW.id_utilisateur_action);
  ELSIF NEW.statut IS DISTINCT FROM OLD.statut THEN
    NEW.date_modification := NOW();
    INSERT INTO historique_statuts_litiges(litige_id, ancien_statut, nouveau_statut, horodatage, id_utilisateur_action)
    VALUES (NEW.id, OLD.statut, NEW.statut, NEW.date_modification, NEW.id_utilisateur_action);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_historique_statut_litige ON litiges;
CREATE TRIGGER trg_historique_statut_litige AFTER INSERT OR UPDATE OF statut ON litiges
FOR EACH ROW EXECUTE FUNCTION journaliser_changement_statut_litige();

CREATE INDEX IF NOT EXISTS idx_litiges_statut ON litiges(statut);
CREATE INDEX IF NOT EXISTS idx_litiges_contrat ON litiges(contrat_id);
CREATE INDEX IF NOT EXISTS idx_historique_litige_date ON historique_statuts_litiges(litige_id, horodatage DESC);
