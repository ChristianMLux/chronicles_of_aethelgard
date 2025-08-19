import { notFound, redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/user";
import { getCity } from "@/lib/city";
import CityHeader from "@/components/CityHeader";
import CityNavigation from "@/components/city/CityNavigation";
import { CityDataProvider } from "@/components/CityDataProvider";

export default async function CityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  const cityData = await getCity(id);
  if (!cityData) {
    notFound();
  }

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
