"use client";
import Link from "next/link";
import { getFirebaseAuth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";

export default function Nav() {
  const auth = getFirebaseAuth();
  const [user] = useAuthState(auth);
  return (
    <nav className="w-full ui-nav p-3 flex items-center justify-between">
      <Link href="/" className="font-semibold">Aethelgard</Link>
      <div className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <Link href="/dashboard" className="underline">Dashboard</Link>
            <Link href="/research" className="underline">Forschung</Link>
            <Link href="/army" className="underline">Armee</Link>
            <Link href="/world" className="underline">Welt</Link>
            <Link href="/reports" className="underline">Berichte</Link>
            <button
              onClick={async () => { await signOut(auth); }}
              className="ui-button px-2 py-1"
              aria-label="Logout"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/signin" className="underline">Login</Link>
            <Link href="/auth/signup" className="underline">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}


