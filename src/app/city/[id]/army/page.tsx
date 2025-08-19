import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/user";
import ArmyClient from "@/components/ArmyClient";
import { getGameConfig } from "@/lib/game";

export default async function ArmyPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/auth/signin");
  }
  const config = await getGameConfig();

  return <ArmyClient initialGameConfig={config} />;
}
