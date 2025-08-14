"use client";
import { numberFmt } from "@/lib/game";
import Image from "next/image";

type Resources = {
    stone: number;
    wood: number;
    food: number;
    mana: number;
};

export default function ResourceBar({ resources }: { resources: Resources }) {
    return (
        <div className="ui-panel p-3 flex items-center gap-4 overflow-auto">
            <Res label="Stein" icon="/assets/icons/resources/stone.png" value={resources.stone} />
            <Res label="Holz" icon="/assets/icons/resources/wood.png" value={resources.wood} />
            <Res label="Nahrung" icon="/assets/icons/resources/food.png" value={resources.food} />
            <Res label="Mana" icon="/assets/icons/resources/mana.png" value={resources.mana} />
        </div>
    );
}

function Res({ label, icon, value }: { label: string; icon: string; value: number }) {
    return (
        <div className="flex items-center gap-2 min-w-[140px]">
            <Image src={icon} alt={label} width={20} height={20} className="icon-tile" />
            <div className="text-sm">
                <div className="text-gray-400 leading-3">{label}</div>
                <div className="font-semibold">{numberFmt.format(Math.floor(value))}</div>
            </div>
        </div>
    );
}
