"use client";

import { ActiveMissions } from "@/components/world/ActiveMissions";
import dynamic from "next/dynamic";
import { useMemo } from "react";

export default function WorldPageClient() {
  const WorldMap = useMemo(
    () =>
      dynamic(() => import("@/components/world/WorldMapClient"), {
        loading: () => <p className="text-center text-white">Loading Map...</p>,
        ssr: false,
      }),
    []
  );

  return (
    <div className="w-full h-screen bg-gray-800">
      <WorldMap />
      <ActiveMissions />
    </div>
  );
}
