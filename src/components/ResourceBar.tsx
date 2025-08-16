"use client";

import { useCityData } from "./CityDataProvider";
import { numberFmt } from "@/lib/game";
import Image from "next/image";

export default function ResourceBar() {
  const { city } = useCityData();

  if (!city.resources) {
    return null;
  }

  const resources = [
    {
      name: "Stein",
      value: city.resources.stone,
      icon: "/assets/icons/resources/stone.png",
    },
    {
      name: "Holz",
      value: city.resources.wood,
      icon: "/assets/icons/resources/wood.png",
    },
    {
      name: "Nahrung",
      value: city.resources.food,
      icon: "/assets/icons/resources/food.png",
    },
    {
      name: "Mana",
      value: city.resources.mana,
      icon: "/assets/icons/resources/mana.png",
    },
  ];

  return (
    <div className="flex justify-center gap-4 mt-2">
      {resources.map((resource) => (
        <div
          key={resource.name}
          className="flex items-center gap-2 px-4 py-2 rounded-lg m-4 min-w-[10rem]"
        >
          <Image
            src={resource.icon}
            alt={resource.name}
            width={512}
            height={512}
            className="w-12 h-12"
          />
          <div className="text-sm">
            <div className="text-gray-400">{resource.name}</div>
            <div className="font-bold">{numberFmt.format(resource.value)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
