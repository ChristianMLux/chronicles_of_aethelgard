"use client";

import { useCity } from "./CityDataProvider";
import { numberFmt } from "@/lib/utils";
import { ResourceKey, Resources } from "@/types";
import Image from "next/image";

interface ResourceBarProps {
  resources?: Partial<Record<ResourceKey, number>>;
  cityResources?: Resources;
  mode?: "total" | "cost";
}

const resourceMeta = {
  stone: { name: "Stein", icon: "/assets/icons/resources/stone.png" },
  wood: { name: "Holz", icon: "/assets/icons/resources/wood.png" },
  food: { name: "Nahrung", icon: "/assets/icons/resources/food.png" },
  mana: { name: "Mana", icon: "/assets/icons/resources/mana.png" },
};

export function ResourceBar({
  resources: propResources,
  cityResources: propCityResources,
  mode = "total",
}: ResourceBarProps) {
  const { city } = useCity();

  const cityResources = propCityResources || city?.resources;
  const displayResources = propResources || city?.resources;

  if (!cityResources || !displayResources) {
    return null;
  }

  const resourceKeys =
    mode === "total"
      ? (Object.keys(resourceMeta) as ResourceKey[])
      : (Object.keys(displayResources) as ResourceKey[]);

  const containerClasses =
    mode === "total"
      ? "flex justify-center gap-4 mt-2"
      : "flex flex-wrap gap-x-4 gap-y-2";

  const itemClasses =
    mode === "total"
      ? "flex items-center gap-2 px-4 py-2 rounded-lg m-4 min-w-[10rem]"
      : "flex items-center gap-2";

  const imageSize = mode === "total" ? 512 : 20;
  const imageClasses = mode === "total" ? "w-12 h-12" : "";

  return (
    <div className={containerClasses}>
      {resourceKeys.map((key) => {
        const value = displayResources[key] || 0;
        const available = cityResources[key] || 0;
        const hasEnough = available >= value;
        const meta = resourceMeta[key];

        if (mode === "cost" && value === 0) return null;

        return (
          <div key={key} className={itemClasses} title={meta.name}>
            <Image
              src={meta.icon}
              alt={meta.name}
              width={imageSize}
              height={imageSize}
              className={imageClasses}
            />
            <div className="text-sm">
              {mode === "total" && (
                <div className="text-gray-400">{meta.name}</div>
              )}
              <div
                className={`font-bold ${
                  mode === "cost" && !hasEnough ? "text-red-500" : ""
                }`}
              >
                {numberFmt.format(value)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
