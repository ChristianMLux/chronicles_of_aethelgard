import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/user";
import ArmyClient from "@/components/ArmyClient";

export default async function ArmyPage({ params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/auth/signin");
  }

  return <ArmyClient cityId={params.id} userId={userId} />;
}
