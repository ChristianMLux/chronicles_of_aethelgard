"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { City } from "@/types";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { useAuth } from "./AuthProvider";
import { getDb } from "@/../firebase";

const db = getDb();

interface CityContextType {
  city: City | null;
  setCity: React.Dispatch<React.SetStateAction<City | null>>;
  loading: boolean;
}

const CityContext = createContext<CityContextType | undefined>(undefined);

export const useCity = () => {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error("useCity must be used within a CityDataProvider");
  }
  return context;
};

interface CityDataProviderProps {
  initialCity: City;
  children: ReactNode;
}

export function CityDataProvider({
  initialCity,
  children,
}: CityDataProviderProps) {
  const [city, setCity] = useState<City | null>(initialCity);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!initialCity.id || !user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const cityRef = doc(db, "users", user.uid, "cities", initialCity.id);

    const unsubscribe = onSnapshot(
      cityRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const cityData = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          } as City;

          if (cityData.buildingQueue) {
            cityData.buildingQueueItem = cityData.buildingQueue.map((item) => {
              const startTime =
                item.startTime instanceof Timestamp
                  ? item.startTime.toDate()
                  : new Date();
              const endTime =
                item.endTime instanceof Timestamp
                  ? item.endTime.toDate()
                  : new Date();
              return { ...item, startTime, endTime };
            });
          }

          if (cityData.trainingQueue) {
            cityData.trainingQueueItem = cityData.trainingQueue.map((item) => {
              const startTime =
                item.startTime instanceof Timestamp
                  ? item.startTime.toDate()
                  : new Date();
              const endTime =
                item.endTime instanceof Timestamp
                  ? item.endTime.toDate()
                  : new Date();
              return { ...item, startTime, endTime };
            });
          }

          setCity(cityData);
        } else {
          console.error("City document does not exist!");
          setCity(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to city data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [initialCity.id, user]);

  const value = { city, setCity, loading };

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}
