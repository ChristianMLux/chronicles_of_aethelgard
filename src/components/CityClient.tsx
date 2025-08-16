"use client";

import { useState, useEffect } from "react";
import { doc, onSnapshot, getFirestore } from "firebase/firestore";
import { getFirebaseApp } from "../../firebase";
import Link from "next/link";
import ResourceBar from "./ResourceBar";
import { CityData } from "@/types";
import CityHeader from "./CityHeader";

interface CityClientProps {
  initialCity: CityData;
}
const app = getFirebaseApp();
const db = getFirestore(app);

export default function CityClient({ initialCity }: CityClientProps) {
  const [city, setCity] = useState<CityData>(initialCity);

  useEffect(() => {
    const docRef = doc(
      db,
      "users",
      initialCity.ownerId,
      "cities",
      initialCity.id
    );

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedData = {
          ...docSnap.data(),
          id: initialCity.id,
          ownerId: initialCity.ownerId,
          location: {
            ...docSnap.data().location,
            continent: initialCity.location.continent,
            territory: initialCity.location.territory,
            region: initialCity.location.region,
          },
        } as CityData;

        setCity(updatedData);
      } else {
        console.error("City document does not exist!");
      }
    });

    return () => unsubscribe();
  }, [
    initialCity.id,
    initialCity.ownerId,
    initialCity.location.continent,
    initialCity.location.territory,
    initialCity.location.region,
  ]);

  if (!city.resources) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading City...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <ResourceBar resources={city.resources} />

      <div className="max-w-7xl mx-auto">
        <CityHeader city={city} />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-4 rounded-lg text-center hover:bg-gray-700 transition-colors">
            <Link
              href={`/city/${city.id}/buildings`}
              className="text-2xl font-semibold"
            >
              Buildings
            </Link>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center hover:bg-gray-700 transition-colors">
            <Link href="/army" className="text-2xl font-semibold">
              Army
            </Link>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center hover:bg-gray-700 transition-colors">
            <Link href="/research" className="text-2xl font-semibold">
              Research
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
