export type Rarity =
  | 'commun'
  | 'rare'
  | 'epique'
  | 'legendaire'
  | 'mythique'
  | 'godlike'
  | 'event';

export type Palier = 1 | 2 | 3;

export interface Contributor {
  name: string;
  uid?: string;
}

export interface Item {
  _id: string;
  id: string;
  name: string;
  rarity: Rarity;
  category?: string;
  cat?: string;
  palier?: Palier;
  lvl?: number;
  set?: string;
  stats?: Record<string, number | [number, number]>;
  classes?: string[];
  images?: string[];
  image?: string;
  lore?: string;
  obtain?: string;
  craft?: string;
  tags?: string[];
  ordre?: number;
  twoHanded?: boolean;
  rune_slots?: number;
  occulte?: boolean;
  unique?: boolean;
  threshold?: number;
  event?: string;
  _contributor?: Contributor;
}

export interface MobLoot {
  id: string;
  chance: number;
}

export interface Mob {
  _id: string;
  id: string;
  name: string;
  type: 'boss' | 'mini_boss' | 'monstre' | 'sbire';
  behavior?: 'passif' | 'neutre' | 'agressif';
  palier?: Palier;
  difficulty?: number;
  lore?: string;
  images?: string[];
  loot?: MobLoot[];
  region?: string;
  regionId?: string;
  coords?: { x: number; y?: number; z: number };
  respawnDelay?: string;
  spawnTime?: string;
  is_underground?: boolean;
  attacks?: unknown;
  map_spawns?: unknown;
  morceaux?: unknown;
  _contributor?: Contributor;
}

export interface PNJ {
  _id: string;
  id: string;
  name: string;
  type?: string;
  tag?: string | string[];
  palier?: Palier;
  region?: string;
  regionId?: string;
  lore?: string;
  images?: string[];
  coords?: { x: number; y?: number; z: number };
  sells?: unknown;
  craft?: unknown;
  instructions?: string;
  is_underground?: boolean;
  _contributor?: Contributor;
}

export interface Region {
  _id: string;
  id: string;
  name: string;
  palier?: Palier;
  lore?: string;
  color?: string;
  canTp?: boolean;
  inCodex?: boolean;
  is_underground?: boolean;
  coords?: unknown;
  images?: string[];
}

export interface QuestObjective {
  texte: string;
  mobs?: { id: string; qte: number }[];
  next?: boolean;
}

export interface Quest {
  _id: string;
  id: string;
  titre?: string;
  name?: string;
  type: 'main' | 'sec' | 'ter';
  npc?: string;
  zone?: string;
  desc?: string;
  palier?: Palier;
  objectifs?: QuestObjective[];
  recompenses?: unknown[];
  mapId?: string;
  is_underground?: boolean;
  ordre?: number;
}

export interface Panoplie {
  _id: string;
  id: string;
  label: string;
  color?: string;
  bonuses?: Record<string, Record<string, number>>;
  ordre?: number;
}

export interface Donjon {
  _id: string;
  id?: string;
  name: string;
}

export interface DumpFile {
  _exportedAt: string;
  collections: {
    items: Item[];
    items_hidden: Item[];
    mobs: Mob[];
    personnages: PNJ[];
    regions: Region[];
    quetes: Quest[];
    panoplies: Panoplie[];
    map_markers: unknown[];
    donjons: Donjon[];
    zones: unknown[];
  };
}

export const RARITY_ORDER: Rarity[] = [
  'commun',
  'rare',
  'epique',
  'legendaire',
  'mythique',
  'godlike',
  'event'
];

export const RARITY_LABEL: Record<Rarity, string> = {
  commun: 'Commun',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
  mythique: 'Mythique',
  godlike: 'Divin',
  event: 'Événement'
};

export const PALIER_ROMAN: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III'
};

export const CATEGORY_LABEL: Record<string, string> = {
  arme_p: 'Arme principale',
  arme_s: 'Arme secondaire',
  plastron: 'Plastron',
  jambières: 'Jambières',
  gants: 'Gants',
  bottes: 'Bottes',
  casque: 'Casque',
  amulette: 'Amulette',
  anneau: 'Anneau',
  bracelet: 'Bracelet',
  artefact: 'Artefact',
  consommable: 'Consommable',
  materiaux: 'Matériaux',
  ressources: 'Ressources',
  rune: 'Rune',
  quete: 'Quête',
  accessoire: 'Accessoire'
};

export const STAT_LABEL: Record<string, string> = {
  degats: 'Dégâts',
  degats_physique: 'Dégâts physiques',
  degats_arme: "Dégâts d'arme",
  degats_magique: 'Dégâts magiques',
  degats_competence: 'Dégâts de compétence',
  degats_projectile: 'Dégâts de projectile',
  vitesse_attaque: "Vitesse d'attaque",
  crit_chance: 'Chance critique',
  crit_degats: 'Dégâts critiques',
  crit_comp_chance: 'Chance crit. compétence',
  crit_comp_degats: 'Dégâts crit. compétence',
  defense: 'Défense',
  maitrise_bloc: 'Maîtrise de blocage',
  puissance_bloc: 'Puissance de blocage',
  sante: 'Santé',
  esquive: 'Esquive',
  reduction_degats: 'Réduction de dégâts',
  reduction_chutes: 'Réduction de chutes',
  tenacite: 'Ténacité',
  res_recul: 'Résistance au recul',
  chance_parade: 'Chance de parade',
  hate: 'Hâte',
  vitesse_deplacement: 'Vitesse de déplacement',
  vitesse_accroupi: 'Vitesse accroupi',
  mana: 'Mana',
  stamina: 'Stamina',
  regen_mana: 'Régén. mana',
  regen_stamina: 'Régén. stamina',
  soin_bonus: 'Soin bonus'
};

export const STAT_UNIT: Record<string, string> = {
  vitesse_attaque: '',
  vitesse_deplacement: '%',
  degats: '',
  defense: '',
  sante: '',
  mana: '',
  stamina: ''
};
