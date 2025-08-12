import { prisma } from "@/lib/db";

// Run production tick for a single city based on elapsed seconds
export async function runCityTick(cityId: string) {
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) return;
  const now = new Date();
  const elapsedSec = Math.max(0, Math.floor((now.getTime() - city.lastTickAt.getTime()) / 1000));
  if (elapsedSec < 1) return;

  const production = (city.production as any) || {};
  const perHour = {
    Stein: Number(production.Stein ?? 0),
    Holz: Number(production.Holz ?? 0),
    Nahrung: Number(production.Nahrung ?? 0),
    Mana: Number(production.Mana ?? 0),
  };

  const add = (perHourValue: number) => BigInt(Math.floor((perHourValue / 3600) * elapsedSec));

  const newStone = minBig(city.stone + add(perHour.Stein), city.capStone);
  const newWood = minBig(city.wood + add(perHour.Holz), city.capWood);
  const newFood = minBig(city.food + add(perHour.Nahrung), city.capFood);
  const newMana = minBig(city.mana + add(perHour.Mana), city.capMana);

  await prisma.city.update({
    where: { id: city.id },
    data: { stone: newStone, wood: newWood, food: newFood, mana: newMana, lastTickAt: now },
  });
}

export async function runPlayerTicks(userId: string) {
  const player = await prisma.player.findUnique({ where: { userId }, include: { cities: true } });
  if (!player) return;
  for (const c of player.cities) {
    await runCityTick(c.id);
  }
}

function minBig(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}



