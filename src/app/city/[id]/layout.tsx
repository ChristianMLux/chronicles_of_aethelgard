import { notFound, redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/user";
import { getCityData, serializeCityData } from "@/lib/city";
import CityHeader from "@/components/CityHeader";
import CityNavigation from "@/components/city/CityNavigation";
import CityDataProvider from "@/components/CityDataProvider";

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/auth/signin");
  }

  const rawCityData = await getCityData(userId, params.id);
  if (!rawCityData) {
    notFound();
  }

  const cityData = serializeCityData(rawCityData);

  return (
    <div className="min-h-screen bg-gray-900 text-white pl-4 pr-4 pt-10">
      <CityDataProvider initialCity={cityData}>
        <div className="max-w-7xl mx-auto ">
          <CityHeader city={cityData} />
          <CityNavigation />

          <div>{children}</div>
        </div>
      </CityDataProvider>
    </div>
  );
}
