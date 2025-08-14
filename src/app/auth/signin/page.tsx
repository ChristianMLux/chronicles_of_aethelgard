"use client";
import { useState } from "react";
import Link from "next/link";
import { getFirebaseAuth } from "../../../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function SignInPage() {
    const auth = getFirebaseAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const idToken = await user.getIdToken();

            const response = await fetch('/api/auth/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                throw new Error("Fehler beim Erstellen der Session.");
            }

            window.location.assign("/dashboard");

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
                <h1 className="text-2xl font-semibold">Anmelden</h1>
                {error && <p className="text-red-500 text-sm">{error}</p>}
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
                    placeholder="Passwort"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border rounded px-3 py-2"
                    required
                />
                <button className="bg-black text-white rounded px-4 py-2" disabled={loading}>
                    {loading ? "Lade..." : "Login"}
                </button>
                <p className="text-sm text-center">
                    Noch kein Konto? <Link className="underline" href="/auth/signup">Registrieren</Link>
                </p>
            </form>
        </div>
    );
}
