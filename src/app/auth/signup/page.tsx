"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseAuth, getDb } from "../../../../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";

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
      // Create Player and starter City in Firestore
      const playerRef = doc(collection(db, "players"), cred.user.uid);
      await setDoc(playerRef, {
        userId: cred.user.uid,
        name: name || cred.user.email?.split("@")[0] || "Spieler",
        class: "Baumeister",
        researches: {},
        createdAt: serverTimestamp(),
      });
      const cityRef = doc(collection(db, "cities"));
      await setDoc(cityRef, {
        id: cityRef.id,
        ownerId: cred.user.uid,
        name: `${name || "Stadt"}s Zuflucht`,
        continent: "Eldoria",
        region: "Grünwald",
        territory: Math.floor(Math.random() * 15) + 1,
        buildingSlots: 25,
        buildings: { Steinbruch: 1, Holzfällerlager: 1, Farmen: 1, Manamine: 0 },
        production: { Stein: 50, Holz: 50, Nahrung: 40, Mana: 5 },
        defense: { Stadtmauer: 0 },
        stone: 500,
        wood: 500,
        food: 500,
        mana: 50,
        workforce: 100,
        capStone: 10000,
        capWood: 10000,
        capFood: 10000,
        capMana: 5000,
        lastTickAt: Date.now(),
        createdAt: serverTimestamp(),
      });
      router.push("/auth/signin");
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message ?? "Unbekannter Fehler";
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
        <button className="bg-black text-white rounded px-4 py-2" disabled={loading}>Konto erstellen</button>
      </form>
    </div>
  );
}


