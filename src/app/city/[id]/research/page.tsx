import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/user";
import ResearchClient from "@/components/ResearchClient";

export default async function ResearchPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/auth/signin");
  }

  return <ResearchClient />;
}
