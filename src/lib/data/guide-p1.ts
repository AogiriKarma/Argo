/**
 * Guide P1 main — un step par quête, avec ce qu'il faut préparer AVANT
 * de la commencer (items, niveau, secondaires obligatoires) et un tip terrain.
 *
 * L'ordre suit l'enchaînement chronologique (ordre du dump). Les items à prep
 * sont ceux qui doivent être en inventaire au moment de parler au PNJ de fin.
 */

export interface PrepItem {
  id: string;
  qty: number;
  source?: string;          // où / comment l'obtenir
}

export interface GuideStep {
  id: string;                                  // quest id
  prepItems?: PrepItem[];                      // ce qu'il faut avoir en inventaire
  prepLevel?: number;                          // niveau requis avant de pouvoir close
  prereqQuests?: { id: string; note?: string }[]; // quêtes secondaires bloquantes
  tactique?: string;                           // tip / ordre / cheese
}

export const stepsP1: GuideStep[] = [
  {
    id: 'p1_tutoriel',
    prepItems: [
      { id: 'buche_de_chene',       qty: 1, source: 'Bûcheronner avec la hâche fournie' },
      { id: 'minerais_de_charbon',  qty: 1, source: 'Miner avec la pioche fournie' },
      { id: 'minerais_de_cuivre',   qty: 1 },
      { id: 'fleur_d_allium',       qty: 1, source: 'Récolter avec la serpe fournie' },
      { id: 'dague_d_entrainement', qty: 1, source: 'Forgeron de l\'île' },
      { id: 'potion_de_vie_i',      qty: 1, source: 'Craft à partir d\'allium' }
    ],
    tactique: 'Garde la pioche, hache et serpe — utilisables ensuite. Tue 2 sangliers corrompus avant de choisir la classe.'
  },
  {
    id: 'p1_un_nouveau_depart',
    prepItems: [
      { id: 'peau_de_sanglier', qty: 12, source: 'Sangliers entre Ville de Départ et Hanaka' }
    ],
    tactique: 'Maître Épéiste en (1808, 4278), puis Abraham (1808, 3650). Farm les 12 peaux entre les deux NPC.'
  },
  {
    id: 'p1_la_vieille_mara',
    tactique: 'Vieille Mara à Hanaka (1562, 3410). Pure discussion.'
  },
  {
    id: 'p1_la_corruption',
    tactique: 'Bloc Glazed Terracotta violet en (1421, 3091), Marécage Putride.'
  },
  {
    id: 'p1_revenir_plus_fort',
    prepLevel: 4,
    tactique: 'Si t\'as fait les 3 quêtes précédentes en grindant les mobs en chemin, tu devrais déjà être lvl 4. Sinon 2-3 sangliers de plus. Puis Maître Épéiste (1839, 4530).'
  },
  {
    id: 'p1_l_aventure_commence',
    prepItems: [
      { id: 'cle_de_la_foret', qty: 1, source: 'Craft sur place via Elma' }
    ],
    tactique: 'Elma à Mizunari (3133, 3665). La clé se craft directement avec elle.'
  },
  {
    id: 'p1_le_ravage_des_nephentes',
    prepItems: [
      { id: 'spore_corrompu', qty: 1, source: 'Drop sur les Nephentes' }
    ],
    tactique: 'Harrold dans les Champs (3324, 3784). Sauve-le en tuant les Nephentes, le spore drop pendant. Retour ME (1839, 4530) à la fin.'
  },
  {
    id: 'p1_velka',
    tactique: 'Velka à CastelBrume (2844, 2994). TP CastelBrume puis discussion.'
  },
  {
    id: 'p1_les_ruines_maudites',
    tactique: 'Trouver les Ruines (2802, 4424) puis Erik (2862, 4490).'
  },
  {
    id: 'p1_le_donjon_des_ruines_maudites',
    prepItems: [
      { id: 'ames_des_ruines', qty: 15, source: 'Farm dans les Ruines Maudites — fais ça avant d\'entrer dans le téléporteur' }
    ],
    tactique: 'Téléporteur en (2780, 4428). Les âmes drop dans la zone même — autant les avoir AVANT de TP.'
  },
  {
    id: 'p1_nasgul_protecteur_maudit',
    prepItems: [
      { id: 'tissu_maudit',   qty: 10, source: 'Drops dans le Donjon Squelette' },
      { id: 'coeur_putrefie', qty: 1,  source: 'Drop dans le donjon' }
    ],
    tactique: 'Spectre Archiviste sur le mur de la Salle de l\'Est (2965, 4285). Loot durant l\'exploration. Boss Nasgul : assène le coup fatal toi-même, sinon ça compte pas.'
  },
  {
    id: 'p1_donjon_mine_de_geldorak',
    tactique: 'Entrée donjon en (4290, 3874). Drop 1× fragment_des_anciens — GARDE-le, t\'en auras besoin ×3 plus tard (quête 16).'
  },
  {
    id: 'p1_retour_a_la_cathedrale',
    prereqQuests: [
      { id: 'p1_par_les_branches_des_anciens', note: 'Obligatoire pour débloquer le TP vers Vallhat (quête 13 te le rappellera).' }
    ],
    tactique: 'Maître Épéiste (1839, 4530), puis Aventurier Mystérieux dans la Taverne (1551, 4310). Enchaîne tout de suite Par les Branches des Anciens.'
  },
  {
    id: 'p1_l_homme_a_capuche',
    tactique: 'TP Vallhat (besoin de Par les Branches des Anciens d\'abord). Maire (422, 3058), puis suivre la trace de gemmes violettes vers (319, 3190).'
  },
  {
    id: 'p1_gorbel_slime_imposant',
    tactique: 'Boss en (297, 3188). Coup fatal nécessaire. Drop 1× fragment_des_anciens — toujours pour la quête 16.'
  },
  {
    id: 'p1_de_retour_a_la_cathedrale',
    tactique: 'Retour Maître Épéiste (1839, 4530), simple discussion.'
  },
  {
    id: 'p1_le_sceau_des_anciens',
    prepItems: [
      { id: 'fragment_des_anciens', qty: 3, source: '1× Donjon Geldorak + 1× Gorbel + 1× à farm (mobs zones avancées)' }
    ],
    tactique: 'Catherine devant le Labyrinthe des Déchus (2384, 2417). Tu TP ensuite vers Îles Flottantes Archipel d\'Ika (3278, 4104) pour le Spectre Mystérieux, retour Catherine.'
  },
  {
    id: 'p1_wali',
    tactique: 'Wali 4 blocs à côté de Catherine (2380, 2411). Discussion uniquement.'
  },
  {
    id: 'p1_mephisto',
    tactique: 'Méphisto à Tolbana, grande salle au point culminant (3203, 1455). TP Tolbana.'
  },
  {
    id: 'p1_wali_l_apprenti',
    tactique: 'Wali à la bibliothèque, salle d\'à côté de Méphisto (3195, 1497). Puis Émy à la forge (3234, 1484).'
  },
  {
    id: 'p1_la_base_du_parchemin',
    prepItems: [
      { id: 'lingot_de_fer',                qty: 10, source: 'Craft à partir de minerais_de_fer + cols, ou Forgeron de Tolbana' },
      { id: 'peau_de_cerf_des_montagnes',   qty: 16, source: 'Marchand Itinérant de Tolbana (12 cols/pièce)' }
    ],
    tactique: 'PRÉPARE TOUT AVANT de parler à Émy. Les 16 peaux te coûtent ~192 cols. Donne à Émy puis retour Wali (3195, 1497).'
  },
  {
    id: 'p1_ramoon',
    tactique: 'Méphisto (3203, 1455) puis Ramoon centre Virelune (1573, 1986). TP Virelune après Méphisto.'
  },
  {
    id: 'p1_chasse_aux_poissons_requin',
    tactique: 'Malrik centre Tolbana ou Virelune (1573, 1986 — semble être un coord partagé). Tue 10 poisson_requin dans le Lac, retour Malrik puis Virel (1539, 1995).'
  },
  {
    id: 'p1_nymbrea_l_ombre_du_lac',
    tactique: 'Léviathan Nymbréa dans l\'Antre d\'Aepep, ouest de Virelune (1420, 1985). Coup fatal nécessaire. Drop coeur_de_nymbrea — GARDE pour quête 25.'
  },
  {
    id: 'p1_sanctuaire_de_xal_zirith',
    tactique: 'Silrix devant le donjon (1007, 1180). Va falloir entrer pour drop venin_d_araignee pour la quête suivante.'
  },
  {
    id: 'p1_retour_a_tolbana',
    prepItems: [
      { id: 'sceau',                qty: 1,  source: 'Drop / craft selon parcours du donjon' },
      { id: 'parchemin_vierge',     qty: 1,  source: 'Vient en récompense de la quête 20 (La Base du Parchemin)' },
      { id: 'poussiere_de_givre',   qty: 32, source: 'À farm en zones froides — anticipe pendant les phases précédentes' },
      { id: 'coeur_de_nymbrea',     qty: 1,  source: 'Drop boss Nymbréa quête 23' },
      { id: 'venin_d_araignee',     qty: 1,  source: 'Drop dans Xal\'Zirith quête 24' }
    ],
    tactique: 'C\'est la quête la plus "lourde" en prep du P1. Vérifie bien ton inventaire avant de remonter à Tolbana. Émy à la forge (3234, 1484).'
  },
  {
    id: 'p1_le_parchemin_de_sceau',
    tactique: 'Retour Méphisto (3203, 1455). Discussion.'
  },
  {
    id: 'p1_le_tombeau_des_harald',
    tactique: 'Harald IV au jardin culminant (3260, 1383). Tombeau Harald I : grotte (3685, 1648) — saute dans le trou SANS BOUGER pour éviter les dégâts de chute.'
  },
  {
    id: 'p1_donjon_le_kobold',
    prepItems: [
      { id: 'viande_de_sanglier', qty: 20, source: 'À garder pour le jumping puzzle — jeter des blocs cheap pour révéler les blocs invisibles' }
    ],
    tactique: 'Harald IV (3260, 1383), puis levier près de la Forge de Tolbana, couloir, Zone Cristal. Jumping puzzle blocs invisibles depuis (3061, 88) — jette des viandes de sanglier pour révéler le chemin. Méphisto en (3047, 1195) puis combat final Kobold.'
  }
];
