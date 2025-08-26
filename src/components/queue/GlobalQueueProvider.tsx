"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "../AuthProvider";
import { getDb } from "@/../firebase";
import {
  collection,
  onSnapshot,
  query,
  DocumentData,
} from "firebase/firestore";
import {
  BuildingQueueItem,
  ResearchQueueItem,
  TrainingQueueItem,
} from "@/types";

interface QueueContextType {
  allBuildingQueues: (BuildingQueueItem & { cityId: string })[];
  allTrainingQueues: (TrainingQueueItem & { cityId: string })[];
  allResearchQueues: (ResearchQueueItem & { cityId: string })[];
  totalQueueCount: number;
}

const GlobalQueueContext = createContext<QueueContextType>({
  allBuildingQueues: [],
  allTrainingQueues: [],
  allResearchQueues: [],
  totalQueueCount: 0,
});

export const useGlobalQueues = () => useContext(GlobalQueueContext);

export const GlobalQueueProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [allBuildingQueues, setAllBuildingQueues] = useState<
    (BuildingQueueItem & { cityId: string })[]
  >([]);
  const [allTrainingQueues, setAllTrainingQueues] = useState<
    (TrainingQueueItem & { cityId: string })[]
  >([]);
  const [allResearchQueues, setAllResearchQueues] = useState<
    (ResearchQueueItem & { cityId: string })[]
  >([]);
  const [totalQueueCount, setTotalQueueCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) {
      setAllBuildingQueues([]);
      setAllTrainingQueues([]);
      setAllResearchQueues([]);
      return;
    }
    const db = getDb();
    const citiesRef = collection(db, "users", user.uid, "cities");
    const q = query(citiesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const buildingQueues: (BuildingQueueItem & { cityId: string })[] = [];
      const trainingQueues: (TrainingQueueItem & { cityId: string })[] = [];
      const researchQueues: (ResearchQueueItem & { cityId: string })[] = [];

      snapshot.forEach((doc) => {
        const cityData = doc.data() as DocumentData;
        const cityId = doc.id;

        if (cityData.buildingQueue) {
          cityData.buildingQueue.forEach((item: BuildingQueueItem) => {
            buildingQueues.push({ ...item, cityId });
          });
        }
        if (cityData.trainingQueue) {
          cityData.trainingQueue.forEach((item: TrainingQueueItem) => {
            trainingQueues.push({ ...item, cityId });
          });
        }
        if (cityData.researchQueue) {
          cityData.researchQueue.forEach((item: ResearchQueueItem) => {
            researchQueues.push({ ...item, cityId });
          });
        }
      });

      setAllBuildingQueues(buildingQueues);
      setAllTrainingQueues(trainingQueues);
      setAllResearchQueues(researchQueues);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    const total =
      allBuildingQueues.length +
      allTrainingQueues.length +
      allResearchQueues.length;
    setTotalQueueCount(total);
  }, [allBuildingQueues, allTrainingQueues, allResearchQueues]);

  const value = {
    allBuildingQueues,
    allTrainingQueues,
    allResearchQueues,
    totalQueueCount,
  };

  return (
    <GlobalQueueContext.Provider value={value}>
      {children}
    </GlobalQueueContext.Provider>
  );
};
