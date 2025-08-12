"use client";
import Link from "next/link";
import { getFirebaseAuth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Home() {
  const auth = getFirebaseAuth();
  const [user] = useAuthState(auth);
  return (
    <div className="p-8 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-semibold">Chroniken von Aethelgard</h1>
      <div className="w-full max-w-3xl grid gap-6 md:grid-cols-2">
        <div className="border rounded p-4 bg-black/5">
          <h2 className="font-semibold mb-2">Die Welt von Aethelgard</h2>
          <p className="text-sm leading-6">
            Nach dem Großen Bruch ist Aethelgard zersplittert. Aus den Ruinen erheben sich neue Reiche – dein Volk findet einen Splitter einer Götterträne und schafft einen sicheren Hafen. Erforsche arkanes Wissen, erweitere dein Königreich und stelle dich den Gefahren einer lebendigen Welt.
          </p>
        </div>
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Spielprinzip</h2>
          <ul className="list-disc list-inside text-sm leading-6">
            <li>Baue Städte und steigere Produktion</li>
            <li>Erforsche Magie und Technologien</li>
            <li>Rekrutiere Armeen und sende Missionen</li>
            <li>Erlebe eine persistente MMO-Welt</li>
          </ul>
        </div>
      </div>
      <div className="flex gap-3">
        {user ? (
          <>
            <Link className="border rounded px-4 py-2" href="/dashboard">Zum Dashboard</Link>
          </>
        ) : (
          <>
            <Link className="border rounded px-4 py-2" href="/auth/signin">Anmelden</Link>
            <Link className="border rounded px-4 py-2" href="/auth/signup">Registrieren</Link>
          </>
        )}
      </div>
    </div>
  );
}
