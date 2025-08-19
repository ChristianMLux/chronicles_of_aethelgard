import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/user";

export default async function ResearchPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/auth/signin");
  }

  return <div>Research Dummy</div>;
}
