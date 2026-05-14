/**
 * Guide manuel P1 main — exécution optimisée pour minimiser les allers-retours
 * post-wipe. Chaque "phase" regroupe des quêtes proches géographiquement et/ou
 * partageant des ressources à farmer.
 *
 * `carry` : items à ramasser en passant durant la phase, qui seront demandés
 *           dans une phase ultérieure. Tu évites ainsi un retour.
 * `sidequests` : quêtes secondaires fortement recommandées dans la zone.
 */

export interface GuideQuestStep {
  id: string;          // quest id (matches dump)
  hint?: string;       // tip terrain / parcours à donner par dessus l'objectif officiel
}

export interface GuideCarry {
  itemId: string;
  qty: number;
  usedIn: string;      // quest id where it'll be turned in
  note?: string;
}

export interface GuidePhase {
  num: number;
  title: string;
  zone: string;
  zoneHint?: string;   // ex: "TP depuis Ville de Départ"
  quests: GuideQuestStep[];
  carry?: GuideCarry[];
  sidequests?: { id: string; note?: string }[];
  notes?: string;      // tips libres
}

export const guideP1: GuidePhase[] = [
  {
    num: 1,
    title: 'Tutoriel — Île du Tutoriel',
    zone: 'Île du Tutoriel',
    zoneHint: 'Spawn de départ. Pas de TP, tu suis Écho.',
    quests: [
      { id: 'p1_tutoriel', hint: 'Garde la pioche, la hache et la serpe — quête de Luc plus tard demande pioche_felee ×3.' }
    ],
    notes: 'Avant de quitter l\'île, choisis ta classe. Tu peux la rechanger plus tard mais autant éviter le détour.'
  },
  {
    num: 2,
    title: 'Ville de Départ → Hanaka → Marécage Putride',
    zone: 'Triangle sud du palier 1',
    zoneHint: 'Tout est à pied / TP courte distance, fais-le d\'une traite.',
    quests: [
      { id: 'p1_un_nouveau_depart', hint: 'Sanglier corrompu autour de la Ville (sur la route vers Hanaka), pas besoin de t\'éloigner.' },
      { id: 'p1_la_vieille_mara' },
      { id: 'p1_la_corruption', hint: 'Le bloc Glazed Terracotta violet, en (1421, 3091).' },
      { id: 'p1_revenir_plus_fort', hint: 'Tu pop probablement lvl 4 en faisant la 1 + des sanglier en chemin. Sinon farm 2-3 mobs rapides à proximité.' }
    ],
    carry: [
      { itemId: 'peau_de_sanglier', qty: 12, usedIn: 'p1_un_nouveau_depart', note: 'Pendant que tu cours entre Ville de Départ et Hanaka' }
    ]
  },
  {
    num: 3,
    title: 'Mizunari — Champs',
    zone: 'Mizunari',
    zoneHint: 'TP Mizunari depuis Ville de Départ.',
    quests: [
      { id: 'p1_l_aventure_commence', hint: 'Elma en (3133, 3665). Tu craftes la clé de la forêt sur place.' },
      { id: 'p1_le_ravage_des_nephentes', hint: 'Harrold dans les Champs (3324, 3784). 5 min à pied d\'Elma. Spore corrompu drop sur les nephentes.' }
    ],
    carry: [
      { itemId: 'cle_de_la_foret', qty: 1, usedIn: 'p1_l_aventure_commence' },
      { itemId: 'spore_corrompu', qty: 1, usedIn: 'p1_le_ravage_des_nephentes' }
    ],
    notes: 'Retour Maître Épéiste (1839, 4530) en fin de quête 6.'
  },
  {
    num: 4,
    title: 'CastelBrume',
    zone: 'CastelBrume',
    zoneHint: 'TP CastelBrume.',
    quests: [
      { id: 'p1_velka', hint: 'Velka en (2844, 2994). Pure discussion, c\'est rapide.' }
    ]
  },
  {
    num: 5,
    title: 'Ruines Maudites + Donjon Squelette',
    zone: 'Ruines Maudites',
    zoneHint: 'TP Ruines Maudites. Phase clé avec 2 donjons enchaînés — viens lvl suffisant.',
    quests: [
      { id: 'p1_les_ruines_maudites' },
      { id: 'p1_le_donjon_des_ruines_maudites', hint: 'Farm âmes_des_ruines ×15 dans la zone même.' },
      { id: 'p1_nasgul_protecteur_maudit', hint: 'Donjon Squelette : Spectre Archiviste (mur Salle Est), puis loot tissu_maudit + coeur_putrefie. Boss : assène le coup fatal.' }
    ],
    carry: [
      { itemId: 'ames_des_ruines', qty: 15, usedIn: 'p1_le_donjon_des_ruines_maudites' },
      { itemId: 'tissu_maudit', qty: 10, usedIn: 'p1_nasgul_protecteur_maudit' },
      { itemId: 'coeur_putrefie', qty: 1, usedIn: 'p1_nasgul_protecteur_maudit' }
    ]
  },
  {
    num: 6,
    title: 'Donjon Mine de Geldorak',
    zone: 'Donjon Mine de Geldorak',
    zoneHint: 'Coords entrée (4290, 3874). Demande la clé de la forêt (déjà craft phase 3).',
    quests: [
      { id: 'p1_donjon_mine_de_geldorak', hint: 'Drop : fragment_des_anciens (reward x1) — garde-le, on en aura besoin ×3 phase 8.' }
    ]
  },
  {
    num: 7,
    title: 'Retour Cathédrale + Vallhat',
    zone: 'Ville de Départ → Vallhat',
    zoneHint: 'D\'abord retour ME, ensuite répare le TP via la sec "Par les Branches des Anciens".',
    quests: [
      { id: 'p1_retour_a_la_cathedrale', hint: 'Aventurier Mystérieux dans la Taverne (1551, 4310).' },
      { id: 'p1_l_homme_a_capuche', hint: 'Maire en (422, 3058). Suit les gemmes violettes vers (319, 3190).' },
      { id: 'p1_gorbel_slime_imposant', hint: 'Boss à (297, 3188). Coup fatal nécessaire.' }
    ],
    sidequests: [
      { id: 'p1_par_les_branches_des_anciens', note: 'Obligatoire pour réparer le TP Vallhat. À faire pendant cette phase, pas après.' }
    ]
  },
  {
    num: 8,
    title: 'Labyrinthe des Déchus + Wali',
    zone: 'Labyrinthe des Déchus',
    zoneHint: 'TP depuis Ville de Départ.',
    quests: [
      { id: 'p1_de_retour_a_la_cathedrale' },
      { id: 'p1_le_sceau_des_anciens', hint: 'Catherine (2384, 2417). Puis TP vers Îles Flottantes Archipel d\'Ika (3278, 4104) pour Spectre Mystérieux. Donne fragment_des_anciens ×3.' },
      { id: 'p1_wali', hint: 'Wali à 4 blocs de Catherine (2380, 2411).' }
    ],
    carry: [
      { itemId: 'fragment_des_anciens', qty: 3, usedIn: 'p1_le_sceau_des_anciens', note: '1 vient déjà du Donjon Geldorak. Les 2 autres : drop de Gorbel (récompense) + à farm.' }
    ]
  },
  {
    num: 9,
    title: 'Tolbana — Installation',
    zone: 'Tolbana',
    zoneHint: 'TP Tolbana. Phase rapide, on enchaîne Méphisto → Wali → Émy au point culminant + forge.',
    quests: [
      { id: 'p1_mephisto', hint: 'Méphisto (3203, 1455) au point culminant.' },
      { id: 'p1_wali_l_apprenti', hint: 'Wali (3195, 1497) salle d\'à côté, puis Émy à la forge (3234, 1484).' },
      { id: 'p1_la_base_du_parchemin', hint: 'À Émy : remets lingot_de_fer ×10 + peau_de_cerf_des_montagnes ×16, puis retour Wali (3195, 1497).' }
    ],
    carry: [
      { itemId: 'lingot_de_fer', qty: 10, usedIn: 'p1_la_base_du_parchemin', note: 'Craft à partir de minerais_de_fer + cols' },
      { itemId: 'peau_de_cerf_des_montagnes', qty: 16, usedIn: 'p1_la_base_du_parchemin', note: 'Vendu par Marchand Itinérant de Tolbana (12 cols/pièce)' }
    ]
  },
  {
    num: 10,
    title: 'Virelune + Antre d\'Aepep',
    zone: 'Virelune',
    zoneHint: 'TP Virelune. Tout se passe autour de (1573, 1986) sauf Nymbréa.',
    quests: [
      { id: 'p1_ramoon', hint: 'Méphisto à Tolbana puis Ramoon centre Virelune (1573, 1986).' },
      { id: 'p1_chasse_aux_poissons_requin', hint: 'Malrik même spot que Ramoon. Vaincre 10 poisson_requin (Lac Virelune). Virel en (1539, 1995).' },
      { id: 'p1_nymbrea_l_ombre_du_lac', hint: 'Antre Aepep à l\'ouest de Virelune (1420, 1985). Boss — coup fatal.' }
    ],
    carry: [
      { itemId: 'coeur_de_nymbrea', qty: 1, usedIn: 'p1_retour_a_tolbana', note: 'Drop boss Nymbréa, garde-le' }
    ]
  },
  {
    num: 11,
    title: 'Xal\'Zirith + Retour Tolbana',
    zone: 'Sanctuaire de Xal\'Zirith → Tolbana',
    zoneHint: 'Donjon en (1007, 1180), puis Émy à Tolbana pour la quête de rendu.',
    quests: [
      { id: 'p1_sanctuaire_de_xal_zirith', hint: 'Silrix devant le donjon (1007, 1180). À l\'intérieur tu vas drop venin_d\'araignée — garde-le.' },
      { id: 'p1_retour_a_tolbana', hint: 'Émy en forge. Remets sceau + parchemin_vierge + poussiere_de_givre ×32 + coeur_de_nymbrea + venin_d_araignee.' }
    ],
    carry: [
      { itemId: 'sceau', qty: 1, usedIn: 'p1_retour_a_tolbana' },
      { itemId: 'parchemin_vierge', qty: 1, usedIn: 'p1_retour_a_tolbana' },
      { itemId: 'poussiere_de_givre', qty: 32, usedIn: 'p1_retour_a_tolbana', note: 'À farm en chemin — drop dans les zones froides' },
      { itemId: 'venin_d_araignee', qty: 1, usedIn: 'p1_retour_a_tolbana', note: 'Drop dans Xal\'Zirith' }
    ]
  },
  {
    num: 12,
    title: 'Parchemin + Tombeau Harald',
    zone: 'Tolbana',
    zoneHint: 'Tout à Tolbana, enchaîne Méphisto → Harald IV → Tombeau Harald I.',
    quests: [
      { id: 'p1_le_parchemin_de_sceau', hint: 'Méphisto (3203, 1455).' },
      { id: 'p1_le_tombeau_des_harald', hint: 'Harald IV au jardin culminant (3260, 1383). Tombeau Harald I : entrée grotte (3685, 1648) — saute dans le trou SANS BOUGER pour pas prendre les dégâts de chute.' }
    ]
  },
  {
    num: 13,
    title: 'Donjon Kobold (boss final P1)',
    zone: 'Tolbana',
    zoneHint: 'Cristal de Tolbana, accessible par la Forge.',
    quests: [
      { id: 'p1_donjon_le_kobold', hint: 'Harald IV → levier près de la Forge (3216, 178) → couloir → Zone Cristal. Parcours jump sur blocs invisibles : jette des Viandes de Sanglier (très cheap) pour révéler le chemin depuis (3061, 88). À la fin, Méphisto en (3047, 1195) puis combat Kobold.' }
    ],
    notes: 'C\'est ici que P1 se conclut. Garde de la viande de sanglier pour le jumping puzzle.'
  }
];
