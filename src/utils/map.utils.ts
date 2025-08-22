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

export const calculateDistance = (
  coords1: { x: number; y: number },
  coords2: { x: number; y: number }
): number => {
  const dx = coords1.x - coords2.x;
  const dy = coords1.y - coords2.y;
  return Math.sqrt(dx * dx + dy * dy);
};
