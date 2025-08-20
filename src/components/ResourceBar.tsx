"use client";

import { useCity } from "./CityDataProvider";
import { numberFmt } from "@/lib/utils";
import { ResourceKey, Resources } from "@/types";
import Image from "next/image";
import { useState, useEffect } from "react";

interface ResourceBarProps {
  resources?: Partial<Record<ResourceKey, number>>;
  cityResources?: Resources;
  mode?: "total" | "cost" | "compact";
  layout?: "horizontal" | "vertical" | "grid";
  showLabels?: boolean;
  iconSize?: "small" | "medium" | "large";
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
  layout = "horizontal",
  showLabels = true,
  iconSize = "medium",
}: ResourceBarProps) {
  const { city } = useCity();
  const [isMobile, setIsMobile] = useState(false);

  const cityResources = propCityResources || city?.resources;
  const displayResources = propResources || city?.resources;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 766);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!cityResources || !displayResources) {
    return null;
  }

  const resourceKeys =
    mode === "total"
      ? (Object.keys(resourceMeta) as ResourceKey[])
      : (Object.keys(displayResources) as ResourceKey[]);

  const getIconSize = () => {
    if (isMobile) return { size: 24, className: "w-6 h-6" };

    switch (iconSize) {
      case "small":
        return { size: 24, className: "w-6 h-6" };
      case "large":
        return { size: 48, className: "w-12 h-12" };
      default:
        return { size: 32, className: "w-8 h-8" };
    }
  };

  const getContainerClasses = () => {
    if (isMobile) {
      return "flex flex-wrap gap-2 justify-center";
    }

    switch (layout) {
      case "vertical":
        return "flex flex-col gap-3";
      case "grid":
        return "grid grid-cols-2 md:grid-cols-4 gap-3";
      default:
        return "flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4";
    }
  };

  const getItemClasses = () => {
    const baseClasses = "resource-item flex items-center gap-1 sm:gap-2";

    if (mode === "compact" || isMobile) {
      return `${baseClasses} px-2 py-1 rounded`;
    }

    if (mode === "total") {
      return `${baseClasses} px-3 sm:px-4 py-1 sm:py-2 rounded-lg 
              bg-black/30 backdrop-blur-sm border border-white/10
              hover:bg-black/40 transition-colors`;
    }

    return baseClasses;
  };

  const { size: imgSize, className: imgClassName } = getIconSize();

  return (
    <div className={`resource-bar ${getContainerClasses()}`}>
      {resourceKeys.map((key) => {
        const value = displayResources[key] || 0;
        const available = cityResources[key] || 0;
        const hasEnough = available >= value;
        const meta = resourceMeta[key];

        if (mode === "cost" && value === 0) return null;

        return (
          <div
            key={key}
            className={getItemClasses()}
            title={`${meta.name}: ${numberFmt.format(value)}`}
          >
            <Image
              src={meta.icon}
              alt={meta.name}
              width={imgSize}
              height={imgSize}
              className={imgClassName}
              priority
            />

            <div className="resource-details flex flex-col">
              {showLabels && !isMobile && mode === "total" && (
                <div className="text-xs text-gray-400 hidden sm:block">
                  {meta.name}
                </div>
              )}

              <div
                className={`
                  font-bold text-sm sm:text-base
                  ${
                    mode === "cost" && !hasEnough
                      ? "text-red-400"
                      : "text-white"
                  }
                  ${isMobile ? "text-xs" : ""}
                `}
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
