"use client";
import { numberFmt } from "@/lib/game";

export default function ResourceBar({ stone, wood, food, mana }: { stone: number; wood: number; food: number; mana: number }) {
  return (
    <div className="ui-panel p-3 flex items-center gap-4 overflow-auto">
      <Res label="Stein" icon="/assets/icons/resources/stone.png" value={stone} />
      <Res label="Holz" icon="/assets/icons/resources/wood.png" value={wood} />
      <Res label="Nahrung" icon="/assets/icons/resources/food.png" value={food} />
      <Res label="Mana" icon="/assets/icons/resources/mana.png" value={mana} />
    </div>
  );
}

function Res({ label, icon, value }: { label: string; icon: string; value: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <img src={icon} alt="" width={20} height={20} className="icon-tile" />
      <div className="text-sm">
        <div className="text-gray-400 leading-3">{label}</div>
        <div className="font-semibold">{numberFmt.format(Math.floor(value))}</div>
      </div>
    </div>
  );
}


