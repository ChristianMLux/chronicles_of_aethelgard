"use client";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseAuth, getDb } from "../../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, doc, getDocs, query, runTransaction, serverTimestamp, where } from "firebase/firestore";
import { RESEARCH_LIST, ResearchKey, getResearchUpgradeCost, getResearchTimeSeconds, numberFmt } from "@/lib/game";
import Link from "next/link";
import Modal from "@/components/Modal";
import Image from "next/image";

type Player = { userId: string; researches?: Record<string, number> };

export default function ResearchPage() {
  const auth = getFirebaseAuth();
  const [user] = useAuthState(auth);
  const db = useMemo(() => getDb(), []);
  const [player, setPlayer] = useState<Player | null>(null);
  const [cities, setCities] = useState<{ id: string; name: string; mana: number }[]>([]);
  const [busy, setBusy] = useState<ResearchKey | null>(null);
  const [selected, setSelected] = useState<ResearchKey | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const pq = query(collection(db, "players"), where("userId", "==", user.uid));
      const ps = await getDocs(pq);
      setPlayer(ps.docs[0]?.data() as Player);

      const cq = query(collection(db, "cities"), where("ownerId", "==", user.uid));
      const cs = await getDocs(cq);
      setCities(cs.docs.map((d) => d.data() as { id: string; name: string; mana: number }));
    })();
  }, [user, db]);

  async function research(key: ResearchKey) {
    if (!user) return;
    setBusy(key);
    try {
      // Pay mana from the first city with enough mana for simplicity
      await runTransaction(db, async (trx) => {
        const pq = query(collection(db, "players"), where("userId", "==", user.uid));
        const ps = await getDocs(pq);
        const pDoc = ps.docs[0];
        if (!pDoc) return;
        const pdata = pDoc.data() as Player;
        const level = pdata.researches?.[key] ?? 0;
        const nextLevel = level + 1;
        const manaCost = getResearchUpgradeCost(nextLevel);

        const cq = query(collection(db, "cities"), where("ownerId", "==", user.uid));
        const cs = await getDocs(cq);
        const cityDoc = cs.docs.find((d) => (d.data() as { mana?: number }).mana! >= manaCost);
        if (!cityDoc) throw new Error("Nicht genug Mana");

        const pRef = doc(db, "players", pDoc.id);
        const cRef = doc(db, "cities", cityDoc.id);
        const manaNow = (cityDoc.data() as { mana: number }).mana;
        trx.update(cRef, { mana: manaNow - manaCost, updatedAt: serverTimestamp() });
        const nextResearches = { ...(pdata.researches ?? {}) };
        nextResearches[key] = nextLevel;
        trx.update(pRef, { researches: nextResearches, updatedAt: serverTimestamp() });
      });
    } finally {
      // reload
      const pq = query(collection(db, "players"), where("userId", "==", user?.uid));
      const ps = await getDocs(pq);
      setPlayer(ps.docs[0]?.data() as Player);
      setBusy(null);
    }
  }

  if (!user) return <div className="p-6">Bitte anmelden.</div>;
  if (!player) return <div className="p-6">Lade Forschung...</div>;

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link className="underline" href="/dashboard">← Zurück</Link>
      <h1 className="text-2xl font-semibold">Forschung</h1>
      <div className="text-sm text-gray-600">Verfügbare Mana (Summe): {cities.reduce((a, c) => a + (c.mana ?? 0), 0)}</div>
      <div className="grid gap-3">
        {RESEARCH_LIST.map((k) => {
          const level = player.researches?.[k] ?? 0;
          const cost = getResearchUpgradeCost(level + 1);
          return (
            <div key={k} className="border rounded p-3 flex items-center justify-between">
              <div className="cursor-pointer" onClick={() => setSelected(k)}>
                <div className="font-medium flex items-center gap-2"><Image src="/assets/icons/resources/mana.png" width={18} height={18} alt="" className="icon-tile"/> {k} — L{level}</div>
                <div className="text-sm text-gray-600">Kosten: Mana {numberFmt.format(cost)}</div>
                <div className="text-xs text-gray-600">Dauer: ~{getResearchTimeSeconds(level + 1)}s</div>
              </div>
              <button className="border rounded px-3 py-1" onClick={() => research(k)} disabled={busy === k}>Forschen</button>
            </div>
          );
        })}
      </div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected} — L${player.researches?.[selected] ?? 0}` : undefined}>
        {selected && (
          <div className="flex flex-col gap-3">
            <div className="h-40 bg-gray-200 rounded" />
            <div className="text-sm">Details und Effekte von {selected}.</div>
            <div className="text-xs text-gray-600">Dauer: ~{getResearchTimeSeconds((player.researches?.[selected] ?? 0) + 1)}s</div>
            <button className="bg-black text-white rounded px-4 py-2 self-start" disabled={busy === selected} onClick={() => selected && research(selected)}>Forschen</button>
          </div>
        )}
      </Modal>
    </div>
  );
}


