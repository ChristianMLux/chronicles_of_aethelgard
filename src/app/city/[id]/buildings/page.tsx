import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/user";
import { CityBuildingsClient } from "@/components/CityBuildingsClient";

export default async function BuildingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/auth/signin");
  }

  return <CityBuildingsClient />;
}
