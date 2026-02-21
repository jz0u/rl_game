// src/ArmorRegistry.js

export const ARMOR_SETS = {
  head: [
    { id: 'head_1',  baseName: 'Medieval_Warfare_Male_Head_1'  },
    { id: 'head_2',  baseName: 'Medieval_Warfare_Male_Head_2'  },
    { id: 'head_3',  baseName: 'Medieval_Warfare_Male_Head_3'  },
    { id: 'head_4',  baseName: 'Medieval_Warfare_Male_Head_4'  },
    { id: 'head_5',  baseName: 'Medieval_Warfare_Male_Head_5'  },
    { id: 'head_6',  baseName: 'Medieval_Warfare_Male_Head_6'  },
    { id: 'head_7',  baseName: 'Medieval_Warfare_Male_Head_7'  },
    { id: 'head_8',  baseName: 'Medieval_Warfare_Male_Head_8'  },
    { id: 'head_9',  baseName: 'Medieval_Warfare_Male_Head_9'  },
    { id: 'head_10', baseName: 'Medieval_Warfare_Male_Head_10' },
  ],
  chest:   [],
  legs:    [],
  feet:    [],
  weapon:  [],
  offhand: [],
};

// Maps internal tag → exact filename suffix
// These match your real files exactly
export const ANIM_SHEETS = [
  { tag: 'idle1',  suffix: '_idle1_diag.png'           },
  { tag: 'idle2',  suffix: '_idle2_diag.png'           },
  { tag: 'walk',   suffix: '_walking_diag.png'         },
  { tag: 'atk1',   suffix: '_MVsv_alt_attack1.png'     },
  { tag: 'atk2',   suffix: '_MVsv_alt_attack2.png'     },
];