"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { doc, onSnapshot, getFirestore } from "firebase/firestore";
import { getFirebaseApp } from "@/../firebase";
import { CityData } from "@/types";

interface CityContextType {
  city: CityData;
  userId: string;
}

const CityContext = createContext<CityContextType | null>(null);

export function useCityData() {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error("useCityData must be used within CityDataProvider");
  }
  return context;
}

interface CityDataProviderProps {
  initialCity: CityData;
  children: ReactNode;
}

export default function CityDataProvider({
  initialCity,
  children,
}: CityDataProviderProps) {
  const [city, setCity] = useState<CityData>(initialCity);
  const app = getFirebaseApp();
  const db = getFirestore(app);

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
            continentName: initialCity.location.continentName,
            territoryName: initialCity.location.territoryName,
          },
        } as CityData;

        setCity(updatedData);
      } else {
        console.error("City document does not exist!");
      }
    });

    return () => unsubscribe();
  }, [
    db,
    initialCity.id,
    initialCity.ownerId,
    initialCity.location.continent,
    initialCity.location.territory,
    initialCity.location.region,
    initialCity.location.continentName,
    initialCity.location.territoryName,
  ]);

  return (
    <CityContext.Provider value={{ city, userId: initialCity.ownerId }}>
      {children}
    </CityContext.Provider>
  );
}
