export interface Mosque {
  type_commune?: string;
  code: number | string;
  region?: string;
  province?: string;
  cercle?: string;
  commune: string;
  nidharat?: string;
  adresse_en_arabe?: string;
  nombre_salle_de_prière_hommes?: number | string;
  surface_salle_de_prière_hommes?: number | string;
  nombre_salle_de_prière_femme?: number | string;
  surface_salle_de_prière_femme?: number | string;
  nombre_maqsura?: number | string;
  surface_maqsura?: number | string;
  nombre_latrines_homme?: number | string;
  surface_latrines_homme?: number | string;
  nombre_latrines_femme?: number | string;
  surface_latrines_femme?: number | string;
  niveau_minaret?: number | string;
  hauteur_minaret?: number | string;
  base_minaret?: string;
  nombre_logement_pour_imam?: number | string;
  surface_logement_pour_imam?: number | string;
  nombre_logement_pour_muezzin?: number | string;
  surface_logement_pour_muezzin?: number | string;
  nombre_commerce?: number | string;
  superficie_commerce?: number | string;
  dépendences_de_rente_autre1?: number | string;
  superficie_habitats?: number | string;
  nombre_msid?: number | string;
  superficie_msid?: number | string;
  superficie_terrain?: number | string;
  superficie_construite_au_sol?: number | string;
  superficie_non_batie?: number | string;
  béton_armé?: string;
  construction_en_terre_adobe?: string;
  construction_en_terre_pisé?: string;
  msq_mat_pierre?: string;
  brique_traditionnel?: string;
  tôle_en_bois?: string;
  tôle_métallique?: string;
  réseau_routier?: string;
  piste_carossable?: string;
  piste_non_carossable?: string;
  accessibilité_handicapé?: string;
  branché_au_réseau_d_eau_potable?: string;
  puits?: string;
  sources?: string;
  branché_au_réseau_d_électricité?: string;
  photovoltaïque?: string;
  traditionnel?: string;
  branché_au_réseau_d_assainissement?: string;
  fosse_septique_puits_perdu?: string;
  aucun?: string;
  existance_de_talus?: string;
  existance_de_rigoles_d_eau?: string;
  ter_gmp_ravin?: string;
  ter_gmp_autre?: string;
  ouverture?: string;
  longitude?: string | number;
  latitude?: string | number;
  etat_batiment?: string;
  date_construction?: string;
  dénomination_en_arabe?: string;
  dénomination_en_français?: string;
  type_de_mosquée?: string;
  status?: string;
  [key: string]: any;
}

export interface CommuneStats {
  commune: string;
  count: number;
  numericFields: Record<string, { total: number; nullMissing: number; flaggedCount: number }>;
  booleanFields: Record<string, { totalY: number; totalN: number; nullMissing: number }>;
  coordinates: {
    valid: number;
    invalid: number;
    null: number;
    outsideMorocco: number;
    incorrectFormat: number;
    outsideProvince: number;
  };
}

export const NUMERIC_FIELDS = [
  "nombre_salle_de_prière_hommes",
  "surface_salle_de_prière_hommes",
  "nombre_salle_de_prière_femme",
  "surface_salle_de_prière_femme",
  "nombre_maqsura",
  "surface_maqsura",
  "nombre_latrines_homme",
  "surface_latrines_homme",
  "nombre_latrines_femme",
  "surface_latrines_femme",
  "niveau_minaret",
  "hauteur_minaret",
  "nombre_logement_pour_imam",
  "surface_logement_pour_imam",
  "nombre_logement_pour_muezzin",
  "surface_logement_pour_muezzin",
  "nombre_commerce",
  "superficie_commerce",
  "dépendences_de_rente_autre1",
  "superficie_habitats",
  "nombre_msid",
  "superficie_msid",
  "date_construction",
  "superficie_terrain",
  "superficie_construite_au_sol",
  "superficie_non_batie"
];

export const BOOLEAN_FIELDS = [
  "béton_armé",
  "construction_en_terre_adobe",
  "construction_en_terre_pisé",
  "msq_mat_pierre",
  "brique_traditionnel",
  "tôle_en_bois",
  "tôle_métallique",
  "réseau_routier",
  "piste_carossable",
  "piste_non_carossable",
  "accessibilité_handicapé",
  "branché_au_réseau_d_eau_potable",
  "puits",
  "sources",
  "branché_au_réseau_d_électricité",
  "photovoltaïque",
  "traditionnel",
  "branché_au_réseau_d_assainissement",
  "fosse_septique_puits_perdu",
  "aucun",
  "existance_de_talus",
  "existance_de_rigoles_d_eau",
  "ter_gmp_ravin",
  "ter_gmp_autre",
  "ouverture"
];

export interface ComparisonResult {
  added: Mosque[];
  removed: Mosque[];
  modified: {
    before: Mosque;
    after: Mosque;
    changes: string[];
  }[];
  summary: {
    totalBefore: number;
    totalAfter: number;
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
    surfaceChanges: number;
    coordinateChanges: number;
    latrineChanges: number;
  };
}

export interface Threshold {
  value: number;
  operator: '>' | '<';
}

export const NUMERIC_FIELD_THRESHOLDS: Record<string, Threshold> = {
  "nombre_salle_de_prière_hommes": { value: 2, operator: '>' },
  "nombre_salle_de_prière_femme": { value: 1, operator: '>' },
  "surface_salle_de_prière_femme": { value: 500, operator: '<' },
  "surface_salle_de_prière_hommes": { value: 500, operator: '<' },
  "nombre_maqsura": { value: 1, operator: '>' },
  "surface_maqsura": { value: 100, operator: '>' },
  "nombre_latrines_homme": { value: 10, operator: '>' },
  "surface_latrines_homme": { value: 60, operator: '>' },
  "nombre_latrines_femme": { value: 3, operator: '>' },
  "surface_latrines_femme": { value: 30, operator: '>' },
  "niveau_minaret": { value: 10, operator: '>' },
  "hauteur_minaret": { value: 20, operator: '>' },
  "nombre_logement_pour_imam": { value: 1, operator: '>' },
  "surface_logement_pour_imam": { value: 100, operator: '>' },
  "nombre_logement_pour_muezzin": { value: 1, operator: '>' },
  "surface_logement_pour_muezzin": { value: 100, operator: '>' },
  "nombre_commerce": { value: 50, operator: '>' },
  "superficie_commerce": { value: 500, operator: '>' },
  "dépendences_de_rente_autre1": { value: 6, operator: '>' },
  "superficie_habitats": { value: 600, operator: '>' },
  "nombre_msid": { value: 1, operator: '>' },
  "superficie_msid": { value: 200, operator: '>' },
  "date_construction": { value: 1926, operator: '<' },
  "superficie_terrain": { value: 2500, operator: '>' },
  "superficie_construite_au_sol": { value: 1500, operator: '>' },
};
