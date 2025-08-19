import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/user";
import ArmyClient from "@/components/ArmyClient";
import { getGameConfig } from "@/lib/game";

export default async function ArmyPage({}: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/auth/signin");
  }
  const config = await getGameConfig();

  return <ArmyClient initialGameConfig={config} />;
}
