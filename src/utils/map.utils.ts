export const TERRAIN_COLORS: Record<string, string> = {
  plains: "#8db153",
  forest: "#2c6a31",
  mountains: "#70665b",
  water: "#4e80a8",
  default: "#333",
};

export const getTerrainColor = (terrain: string): string => {
  return TERRAIN_COLORS[terrain] || TERRAIN_COLORS.default;
};
