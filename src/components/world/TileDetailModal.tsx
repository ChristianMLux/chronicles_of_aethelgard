"use client";

import { Tile, City, WorldMissionAction } from "@/types";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import MissionModal from "./MissionModal";

interface TileDetailModalProps {
  tile: Tile | null;
  onClose: () => void;
  isSettleMode: boolean;
  onSettle: (tileId: string, cityId: string) => void;
  ownerProfile: { username: string } | null;
  originCity: City | null;
}

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted ? createPortal(children, document.body) : null;
};

export default function TileDetailModal({
  tile,
  onClose,
  isSettleMode,
  onSettle,
  ownerProfile,
  originCity,
}: TileDetailModalProps) {
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [missionAction, setMissionAction] =
    useState<WorldMissionAction>("ATTACK");

  if (!tile) return null;

  const handleOpenMission = (action: WorldMissionAction) => {
    if (!originCity) {
      alert("You need a city to send missions from!");
      return;
    }
    setMissionAction(action);
    setShowMissionModal(true);
  };

  const handleMissionStart = () => {
    //TODO: Add live update for troop-movement at some point
    console.log("Mission started!");
  };

  const getModalContent = () => {
    switch (tile.type) {
      case "npc_camp":
        return (
          <div>
            <Image
              src="/assets/icons/world/enemy/enemy_camp.png"
              alt="NPC Camp"
              width={400}
              height={300}
              className="mx-auto rounded-md object-cover"
            />
            <div className="mt-4 text-center text-gray-300">
              <p>
                Level:{" "}
                <span className="font-bold text-white">{tile.npcLevel}</span>
              </p>
              <p>
                Swordsmen:{" "}
                <span className="font-bold text-white">
                  {tile.npcTroops?.swordsman}
                </span>
              </p>
              <p>
                Archers:{" "}
                <span className="font-bold text-white">
                  {tile.npcTroops?.archer}
                </span>
              </p>
              <p>
                Knights:{" "}
                <span className="font-bold text-white">
                  {tile.npcTroops?.knight}
                </span>
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => handleOpenMission("SPY")}
                className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600 font-semibold"
              >
                Scout
              </button>
              <button
                onClick={() => handleOpenMission("ATTACK")}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
              >
                Attack
              </button>
            </div>
          </div>
        );
      case "resource":
        return (
          <div>
            <Image
              src={`/assets/icons/resources/${tile.resourceType}.png`}
              alt={tile.resourceType || "Resource"}
              width={128}
              height={128}
              className="mx-auto"
            />
            <div className="mt-4 text-center text-gray-300">
              <p className="capitalize text-xl font-bold text-white">
                {tile.resourceType}
              </p>
              <p>
                Amount:{" "}
                <span className="font-bold text-white">
                  {tile.resourceAmount}
                </span>
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => handleOpenMission("GATHER")}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
              >
                Gather
              </button>
            </div>
          </div>
        );
      case "city":
        return (
          <div>
            <Image
              src="/assets/icons/world/city/city_world_map.png"
              alt="City"
              width={400}
              height={300}
              className="mx-auto rounded-md object-cover"
            />
            <div className="mt-4 text-center text-gray-300">
              <p>A mighty city stands here.</p>
              <p className="mt-2">
                Owner:{" "}
                <span className="font-bold text-white">
                  {ownerProfile?.username || "Unknown"}
                </span>
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-4">
              {originCity && tile.ownerId !== originCity.ownerId ? (
                <>
                  <button
                    onClick={() => handleOpenMission("SPY")}
                    className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600 font-semibold"
                  >
                    Spy
                  </button>
                  <button
                    onClick={() => handleOpenMission("ATTACK")}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                  >
                    Attack
                  </button>
                  <button
                    onClick={() => handleOpenMission("SEND_RSS")}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 front-semibold"
                  >
                    Send resources
                  </button>
                </>
              ) : (
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold">
                  Visit City
                </button>
              )}
            </div>
          </div>
        );
      case "empty":
        return (
          <div className="text-center text-gray-300">
            <p className="text-lg">An empty plot of land.</p>
            <p>
              Terrain:{" "}
              <span className="capitalize font-bold text-white">
                {tile.terrain}
              </span>
            </p>
            <div className="mt-6 flex justify-center gap-4">
              {isSettleMode ? (
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                  onClick={() => onSettle(tile.id, "ID_DER_ERSTEN_STADT")}
                >
                  Settle Capital Here
                </button>
              ) : originCity ? (
                <button
                  onClick={() => handleOpenMission("GATHER")}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                >
                  Send Troops
                </button>
              ) : (
                <p className="text-sm text-gray-400">
                  You can only settle if you don&apos;t have a city on the map.
                </p>
              )}
            </div>
          </div>
        );
      default:
        return <p>Details for this tile are not available.</p>;
    }
  };

  const getModalTitle = () => {
    switch (tile.type) {
      case "npc_camp":
        return `NPC Camp (Level ${tile.npcLevel})`;
      case "resource":
        return `Resource Field (${tile.coords.x}, ${tile.coords.y})`;
      case "city":
        return `City of ${ownerProfile?.username || "..."}`;
      case "empty":
        return `Empty Land (${tile.coords.x}, ${tile.coords.y})`;
      default:
        return "Tile Details";
    }
  };

  return (
    <>
      <ModalPortal>
        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.2s ease-out forwards;
          }
        `}</style>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <div
            className="rounded-lg shadow-lg w-full max-w-md border bg-gray-800 border-gray-600 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-600 px-4 py-3">
              <h3 className="font-semibold text-lg text-white">
                {getModalTitle()}
              </h3>
              <button
                aria-label="Close"
                className="text-gray-400 hover:text-white text-2xl leading-none px-2 py-1 rounded"
                onClick={onClose}
              >
                ×
              </button>
            </div>
            <div className="p-6">{getModalContent()}</div>
          </div>
        </div>
      </ModalPortal>

      {showMissionModal && originCity && (
        <ModalPortal>
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <MissionModal
              targetTile={tile}
              originCity={originCity}
              initialAction={missionAction}
              onClose={() => setShowMissionModal(false)}
              onMissionStart={handleMissionStart}
            />
          </div>
        </ModalPortal>
      )}
    </>
  );
}
