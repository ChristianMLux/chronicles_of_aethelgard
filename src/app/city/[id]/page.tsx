import { redirect } from "next/navigation";

export default async function CityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/city/${id}/buildings`);
}
