import { GAME_CONSTANTS } from "@/config/game.constants";
import { Tile } from "@/types";
import { useEffect } from "react";
import { useMapEvents } from "react-leaflet";
import { Map } from "leaflet";
interface ChunkLoaderProps {
  setTiles: React.Dispatch<React.SetStateAction<Tile[]>>;
  loadedChunks: Set<string>;
  setLoadedChunks: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export default function ChunkLoader({
  setTiles,
  loadedChunks,
  setLoadedChunks,
}: ChunkLoaderProps) {
  const map = useMapEvents({
    moveend: () =>
      fetchVisibleChunks(map, setTiles, loadedChunks, setLoadedChunks),
  });

  useEffect(() => {
    fetchVisibleChunks(map, setTiles, loadedChunks, setLoadedChunks);
  }, [map, setTiles, loadedChunks, setLoadedChunks]);

  return null;
}

const fetchVisibleChunks = async (
  map: Map,
  setTiles: React.Dispatch<React.SetStateAction<Tile[]>>,
  loadedChunks: Set<string>,
  setLoadedChunks: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
  const bounds = map.getBounds();

  const minX = Math.max(
    0,
    Math.floor(bounds.getWest() / GAME_CONSTANTS.CHUNK_SIZE)
  );
  const maxX = Math.min(
    GAME_CONSTANTS.WORLD_SIZE / GAME_CONSTANTS.CHUNK_SIZE - 1,
    Math.floor(bounds.getEast() / GAME_CONSTANTS.CHUNK_SIZE)
  );
  const minY = Math.max(
    0,
    Math.floor(-bounds.getNorth() / GAME_CONSTANTS.CHUNK_SIZE)
  );
  const maxY = Math.min(
    GAME_CONSTANTS.WORLD_SIZE / GAME_CONSTANTS.CHUNK_SIZE - 1,
    Math.floor(-bounds.getSouth() / GAME_CONSTANTS.CHUNK_SIZE)
  );

  const newChunksToLoad = [];

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const chunkId = `${x},${y}`;
      if (!loadedChunks.has(chunkId)) {
        newChunksToLoad.push({ x, y });
        loadedChunks.add(chunkId);
      }
    }
  }

  if (newChunksToLoad.length === 0) return;

  const promises = newChunksToLoad.map((chunk) =>
    fetch(`/api/world/chunks?x=${chunk.x}&y=${chunk.y}`).then((res) =>
      res.json()
    )
  );

  const results = await Promise.all(promises);
  const newTiles = results.flat();

  if (newTiles.length > 0) {
    setTiles((prevTiles) => [...prevTiles, ...newTiles]);
  }
  setLoadedChunks(new Set(loadedChunks));
};
