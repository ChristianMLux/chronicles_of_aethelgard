"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Warehouse,
  Users,
  Newspaper,
  Shield,
  Coins,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { EnhancedCityCard, EnhancedCity } from "./EnhancedCityCard";
import { ActiveMissionCard } from "./activeMissionCard/ActiveMissionCard";
import { DashboardCard } from "./DashboardCard";
import { numberFmt } from "@/lib/utils";
import { WorldMission } from "@/types";
import { useAuth } from "../AuthProvider";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getDb } from "@/../firebase";

interface DashboardClientProps {
  initialData: {
    cities: EnhancedCity[];
    missions: WorldMission[];
    stats: {
      totalCities: number;
      totalArmy: {
        swordsman: number;
        archer: number;
        knight: number;
      };
      totalResources: {
        stone: number;
        wood: number;
        food: number;
        mana: number;
      };
    };
  };
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [outgoingMissions, setOutgoingMissions] = useState<WorldMission[]>([]);
  const [incomingMissions, setIncomingMissions] = useState<WorldMission[]>([]);
  const db = getDb();
  useEffect(() => {
    if (!user?.uid) {
      setOutgoingMissions([]);
      setIncomingMissions([]);
      return;
    }

    const worldMissionsRef = collection(db, "worldMissions");

    const outgoingQuery = query(
      worldMissionsRef,
      where("ownerId", "==", user.uid),
      where("status", "!=", "completed")
    );
    const unsubscribeOutgoing = onSnapshot(outgoingQuery, (snapshot) => {
      const missions = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as WorldMission)
      );
      setOutgoingMissions(missions);
    });

    const incomingQuery = query(
      worldMissionsRef,
      where("targetOwnerId", "==", user.uid),
      where("status", "!=", "completed")
    );
    const unsubscribeIncoming = onSnapshot(incomingQuery, (snapshot) => {
      const missions = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as WorldMission)
      );
      setIncomingMissions(missions);
    });

    return () => {
      unsubscribeOutgoing();
      unsubscribeIncoming();
    };
  }, [db, user?.uid]);

  const allMissions = useMemo(
    () => [...outgoingMissions, ...incomingMissions],
    [outgoingMissions, incomingMissions]
  );

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/dashboard/data");
      if (response.ok) {
        const newData = await response.json();
        setDashboardData(newData);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const { cities, stats } = dashboardData;

  const mockAlliance = { name: "Die Silberne Hand", members: 42, rank: 7 };
  const mockEvents = [
    {
      title: "Fest der Ernte",
      description: "Bonus auf Nahrungsproduktion",
      timeLeft: "2 Tage",
    },
    {
      title: "Ruf des Krieges",
      description: "Schnellere Truppenausbildung",
      timeLeft: "5 Stunden",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pt-24">
      <div className="max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Reichsübersicht</h1>
            <p className="text-sm text-gray-400 mt-1">
              Letztes Update: {lastUpdate.toLocaleTimeString("de-DE")}
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="ml-2 text-blue-400 hover:text-blue-300 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={isRefreshing ? "animate-spin" : ""}
                />
              </button>
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="text-blue-400" size={16} />
              <div>
                <p className="text-gray-400">Gesamtarmee</p>
                <p className="font-bold">
                  {stats.totalArmy.swordsman +
                    stats.totalArmy.archer +
                    stats.totalArmy.knight}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="text-yellow-400" size={16} />
              <div>
                <p className="text-gray-400">Ressourcen</p>
                <p className="font-bold">
                  {numberFmt.format(
                    stats.totalResources.stone +
                      stats.totalResources.wood +
                      stats.totalResources.food +
                      stats.totalResources.mana
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Cities Section */}
          <div className="xl:col-span-2">
            <DashboardCard
              title="Meine Städte"
              icon={<Warehouse size={20} />}
              className="h-full"
            >
              {cities.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cities.map((city) => (
                      <EnhancedCityCard key={city.id} city={city} />
                    ))}
                  </div>

                  {/* Resource Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <h3 className="text-sm font-semibold mb-2 text-gray-400">
                      Ressourcen-Übersicht
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span>🪨</span>
                        <span>
                          {numberFmt.format(stats.totalResources.stone)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🪵</span>
                        <span>
                          {numberFmt.format(stats.totalResources.wood)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🍎</span>
                        <span>
                          {numberFmt.format(stats.totalResources.food)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>💎</span>
                        <span>
                          {numberFmt.format(stats.totalResources.mana)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">
                    Noch keine Stadt gegründet.
                  </p>
                  <Link href="/world" className="ui-button px-4 py-2">
                    Zur Weltkarte
                  </Link>
                </div>
              )}
            </DashboardCard>
          </div>

          {/* Active Missions */}
          <div className="lg:col-span-1">
            <ActiveMissionCard missions={allMissions} userId={user?.uid} />
          </div>

          {/* Alliance & Events */}
          <div className="flex flex-col gap-6">
            <DashboardCard title="Allianz" icon={<Users size={20} />}>
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-lg">{mockAlliance.name}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-400">
                      {mockAlliance.members} Mitglieder
                    </p>
                    <p className="text-sm text-yellow-400">
                      Rang #{mockAlliance.rank}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-700">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Allianz-Level</span>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: "65%" }}
                    />
                  </div>
                </div>

                <Link href="#" className="ui-link text-sm block text-center">
                  Zur Allianz →
                </Link>
              </div>
            </DashboardCard>

            <DashboardCard
              title="Events & Neuigkeiten"
              icon={<Newspaper size={20} />}
            >
              <ul className="space-y-3">
                {mockEvents.map((event, i) => (
                  <li key={i} className="border-l-2 border-rune pl-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm">{event.title}</h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {event.description}
                        </p>
                      </div>
                      <span className="text-xs text-yellow-400 whitespace-nowrap ml-2">
                        {event.timeLeft}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-3 border-t border-gray-700">
                <Link
                  href="/world"
                  className="text-xs text-blue-400 hover:underline"
                >
                  Alle Events anzeigen →
                </Link>
              </div>
            </DashboardCard>
          </div>
        </div>

        {/* Army Overview */}
        <div className="mt-6">
          <DashboardCard
            title="Armee-Übersicht"
            icon={<TrendingUp size={20} />}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Schwertkämpfer</p>
                    <p className="text-2xl font-bold">
                      {stats.totalArmy.swordsman}
                    </p>
                  </div>
                  <span className="text-4xl">⚔️</span>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Bogenschützen</p>
                    <p className="text-2xl font-bold">
                      {stats.totalArmy.archer}
                    </p>
                  </div>
                  <span className="text-4xl">🏹</span>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Ritter</p>
                    <p className="text-2xl font-bold">
                      {stats.totalArmy.knight}
                    </p>
                  </div>
                  <span className="text-4xl">🐴</span>
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
