import { redirect, notFound } from "next/navigation";
import CityClient from "@/components/CityClient";
import { getCurrentUserId } from "@/lib/user";
import { getCityData } from "@/lib/city";
import { serializeCityData } from "@/lib/city";

type Props = { params: { id: string } };

export default async function CityPage({ params }: Props) {
  const { id: cityId } = params;

  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/auth/signin");
  }

  const city = await getCityData(userId, cityId);

  if (!city) {
    notFound();
  }
  const serializableCity = serializeCityData(city);

  return <CityClient initialCity={serializableCity} />;
}
