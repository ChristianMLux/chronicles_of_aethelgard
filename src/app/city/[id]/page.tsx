import { redirect } from "next/navigation";

export default function CityPage({ params }: { params: { id: string } }) {
  redirect(`/city/${params.id}/buildings`);
}
