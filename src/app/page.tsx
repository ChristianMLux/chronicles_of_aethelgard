"use client";
import Link from "next/link";
import { getFirebaseAuth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Home() {
  const auth = getFirebaseAuth();
  const [user] = useAuthState(auth);
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center text-white p-8 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center brightness-75"
        style={{
          backgroundImage: "url('/assets/ui/background_landing.jpg')",
          transform: "scale(1.05)",
        }}
      />
      <div className="absolute inset-0 bg-black/60"></div>

      <div className="relative z-10 flex flex-col items-center gap-6 text-center animate-fadeIn">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-shadow-lg">
          Chroniken von Aethelgard
        </h1>
        <p className="max-w-2xl text-lg text-gray-200 text-shadow">
          Nach dem Großen Bruch ist Aethelgard zersplittert. Erhebe dein Reich
          aus den Ruinen, erforsche arkane Mächte und schmiede dein Schicksal in
          einer persistenten Welt.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          {user ? (
            <Link
              className="ui-button px-8 py-3 text-lg font-semibold"
              href="/dashboard"
            >
              Zum Dashboard
            </Link>
          ) : (
            <>
              <Link
                className="ui-button px-8 py-3 text-lg font-semibold"
                href="/auth/signin"
              >
                Anmelden
              </Link>
              <Link
                className="border border-white/50 rounded-md px-8 py-3 text-lg font-semibold hover:bg-white/10 transition-colors"
                href="/auth/signup"
              >
                Registrieren
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
