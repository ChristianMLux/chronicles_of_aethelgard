"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth, getDb } from "../../../../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

export default function SignUpPage() {
  const router = useRouter();
  const auth = getFirebaseAuth();
  const db = getDb();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });

      const batch = writeBatch(db);
      const userRef = doc(collection(db, "users"), cred.user.uid);
      const userCityRef = doc(collection(db, "users", cred.user.uid, "cities"));
      batch.set(userRef, {
        userId: cred.user.uid,
        name: name || cred.user.email?.split("@")[0] || "User",
        class: "Bauer",
        createdAt: serverTimestamp(),
      });

      batch.set(userCityRef, {
        id: userCityRef.id,
        ownerId: cred.user.uid,
        name: `${name || "Stadt"}s Zuflucht`,
        location: {
          continent: "Eldoria",
          region: "Grünwald",
          territory: Math.floor(Math.random() * 15) + 1,
        },
        buildingSlots: 25,
        buildings: {
          quarry: 1,
          sawmill: 1,
          farm: 1,
          manamine: 1,
        },
        production: { stone: 50, wood: 50, food: 40, mana: 5 },
        defense: { Stadtmauer: 0 },
        resources: {
          stone: 5000,
          wood: 5000,
          food: 5000,
          mana: 500,
        },
        capacity: {
          workforce: 100,
          capStone: 10000,
          capWood: 10000,
          capFood: 10000,
          capMana: 5000,
        },
        army: {
          archer: 0,
          knight: 0,
          swordsman: 0,
        },
        research: {
          blacksmithing: 1,
          armorsmithing: 1,
          administration: 1,
          enchanting: 1,
          espionage: 1,
          logistics: 1,
        },
        researchQueue: [],
        lastTickAt: Date.now(),
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      router.push("/auth/signin");
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ?? "Unbekannter Fehler";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 w-full max-w-sm">
        <h1 className="text-2xl font-semibold">Registrieren</h1>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <input
          type="text"
          placeholder="Spielername"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Passwort (min. 6 Zeichen)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          className="border rounded px-3 py-2"
          required
        />
        <button
          className="bg-black text-white rounded px-4 py-2"
          disabled={loading}
        >
          Konto erstellen
        </button>
      </form>
    </div>
  );
}
