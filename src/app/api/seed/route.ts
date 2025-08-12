import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  // Create an example NPC player with a city if none exists
  const count = await prisma.player.count();
  if (count === 0) {
    const user = await prisma.user.create({ data: { email: `npc@aethelgard.local`, name: "NPC" } });
    const player = await prisma.player.create({ data: { userId: user.id, name: "NPC", class: "Weiser", researches: {} } });
    await prisma.city.create({
      data: {
        ownerId: player.id,
        name: "Graustein",
        continent: "Eldoria",
        region: "Grauwacht",
        territory: 7,
        buildings: { Steinbruch: 3, Holzfällerlager: 2, Farmen: 2 },
        production: { Stein: 120, Holz: 90, Nahrung: 80, Mana: 10 },
        defense: { Stadtmauer: 1 },
        stone: BigInt(2500),
        wood: BigInt(1800),
        food: BigInt(1600),
        mana: BigInt(200),
        workforce: BigInt(200),
      },
    });
  }
  return NextResponse.json({ ok: true });
}



