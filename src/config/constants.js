export const GAME_WINDOW_WIDTH  = 1280;
export const GAME_WINDOW_HEIGHT = 720;
export const GAME_WINDOW_CENTER = { X: GAME_WINDOW_WIDTH / 2, Y: GAME_WINDOW_HEIGHT / 2 };
export const PANEL_SCALE    = 0.75;
export const CELL_SIZE      = 100;
export const ICON_SIZE      = 75;
export const NAV_BTN_WIDTH  = 46;
export const NAV_BTN_HEIGHT = 167;
export const SLOT_BOX_SIZE  = 90;
export const SLOT_SPACING   = 120;
export const INVENTORY_SIZE = 24;
export const DEPTH_UI       = 10;
export const DEPTH_UI_TOP   = 20;
export const CAMERA_ZOOM    = 1;

// --- Colors ---
export const COLOR_PANEL_BG      = 0xdbc8a8;  // panel background fill
export const COLOR_PANEL_BORDER  = 0x8b6914;  // gold border line
export const COLOR_SLOT_DARK     = 0x1a1a1a;  // dark slot / overlay fill
export const COLOR_DAMAGE_RED    = 0xff2222;  // hit flash, HP bar fill, damage indicators
export const COLOR_HP_BAR_BG     = 0x880000;  // HP bar background (dark red)

// --- Depths ---
export const DEPTH_HUD           = 100;  // HUD back layer
export const DEPTH_HUD_MID       = 101;  // HUD skill slots, EXP bar, orbs
export const DEPTH_HUD_TOP       = 102;  // HUD front layer, mask rect
export const DEPTH_EFFECTS       = 9998; // attack arc graphics
export const DEPTH_EFFECTS_TOP   = 9999; // slash trail, impact flash, particles, cursor label

// --- Sprite / animation ---
export const SPRITE_FRAME_SIZE   = 128;  // spritesheet frame dimensions (px)

// --- Combat feel ---
export const KNOCKBACK_DURATION_MS  = 200; // knockback tween duration
export const KNOCKBACK_DISTANCE_PX  = 20;  // knockback nudge distance
