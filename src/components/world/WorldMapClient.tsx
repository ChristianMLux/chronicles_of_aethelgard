"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Rectangle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLngBounds } from "leaflet";
import { Tile, City } from "@/types";
import TileDetailModal from "./TileDetailModal";
import { GAME_CONSTANTS } from "@/config/game.constants";
import { getTerrainColor } from "@/utils/map.utils";
import ChunkLoader from "./ChunkLoader";
import MapMarkers from "./MapMarker";

export default function WorldMapClient() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loadedChunks, setLoadedChunks] = useState<Set<string>>(new Set());
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);

  const [isSettleMode, setIsSettleMode] = useState(false);
  const [isLoadingSettleStatus, setIsLoadingSettleStatus] = useState(true);
  const [playerCities, setPlayerCities] = useState<City[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isSettling, setIsSettling] = useState(false);

  const [userProfiles, setUserProfiles] = useState<
    Record<string, { username: string }>
  >({});

  useEffect(() => {
    const checkSettleStatus = async () => {
      try {
        const response = await fetch("/api/user/cities");
        if (!response.ok) throw new Error("Failed to fetch cities");

        const cities: City[] = await response.json();
        setPlayerCities(cities);
        const hasSettledCity = cities.some((city) => city.tileId);
        if (cities.length === 0 || !hasSettledCity) {
          setIsSettleMode(true);
        }
      } catch (error) {
        console.error("Could not check player's settle status:", error);
      } finally {
        setIsLoadingSettleStatus(false);
      }
    };

    checkSettleStatus();
  }, []);

  const handleTileClick = async (tile: Tile) => {
    if (isSettleMode && tile.type !== "empty") {
      alert("Du kannst nur auf einem leeren Feld siedeln.");
      return;
    }

    if (tile.type === "city" && tile.ownerId && !userProfiles[tile.ownerId]) {
      try {
        console.log("yes wir sind hier");
        const response = await fetch(`/api/user/${tile.ownerId}`);

        if (response.ok) {
          const profile = await response.json();
          console.log("resp", response);
          setUserProfiles((prev) => ({
            ...prev,
            [tile.ownerId as string]: profile,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    }
    setSelectedTile(tile);
    console.log(tile);
  };

  const handleCloseModal = () => {
    setSelectedTile(null);
  };

  const handleSettle = async (tileId: string) => {
    const cityToSettle = playerCities.find((city) => !city.tileId);
    if (!cityToSettle) {
      alert("Error: No city available to settle.");
      return;
    }

    setIsSettling(true);
    try {
      const response = await fetch("/api/world/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tileId: tileId,
          cityId: cityToSettle.id,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to settle city.");
      }

      alert("City settled successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Settle action failed:", error);
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setIsSettling(false);
      handleCloseModal();
    }
  };

  const bounds: LatLngBounds = new LatLngBounds(
    [-GAME_CONSTANTS.WORLD_SIZE, 0],
    [0, GAME_CONSTANTS.WORLD_SIZE]
  );

  if (isLoadingSettleStatus) {
    return <p className="text-center text-white">Checking player status...</p>;
  }

  return (
    <>
      {isSettleMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg">
          Wähle einen Ort auf der Karte, um deine Hauptstadt zu gründen!
        </div>
      )}

      <MapContainer
        center={[-GAME_CONSTANTS.WORLD_SIZE / 2, GAME_CONSTANTS.WORLD_SIZE / 2]}
        zoom={3}
        style={{
          height: "100%",
          width: "100%",
          backgroundColor: "#1a202c",
          zIndex: 1,
        }}
        crs={L.CRS.Simple}
        maxBounds={bounds}
        minZoom={2}
      >
        <TileLayer url="" attribution="Chroniken von Aethelgard" />

        {tiles.map((tile) => (
          <Rectangle
            key={tile.id}
            bounds={[
              [-tile.coords.y - 1, tile.coords.x],
              [-tile.coords.y, tile.coords.x + 1],
            ]}
            pathOptions={{
              color: getTerrainColor(tile.terrain),
              fillOpacity: 0.7,
              weight: 1,
              interactive: tile.type === "empty",
            }}
            eventHandlers={{
              click: () => {
                if (tile.type === "empty") {
                  handleTileClick(tile);
                }
              },
            }}
          />
        ))}

        <MapMarkers tiles={tiles} onTileClick={handleTileClick} />

        <ChunkLoader
          setTiles={setTiles}
          loadedChunks={loadedChunks}
          setLoadedChunks={setLoadedChunks}
        />
      </MapContainer>

      <TileDetailModal
        tile={selectedTile}
        onClose={handleCloseModal}
        isSettleMode={isSettleMode}
        onSettle={handleSettle}
        ownerProfile={
          selectedTile?.ownerId ? userProfiles[selectedTile.ownerId] : null
        }
        originCity={playerCities[0]}
      />
    </>
  );
}
