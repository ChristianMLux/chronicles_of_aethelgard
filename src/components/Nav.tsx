"use client";
import Link from "next/link";
import { getFirebaseAuth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import Image from "next/image";

export default function Nav() {
  const auth = getFirebaseAuth();
  const [user] = useAuthState(auth);
  return (
    <nav className="w-full ui-nav h-16 px-3 flex items-center justify-between">
      <Link
        href="/"
        className="flex items-center gap-2 hover:opacity-90 transition-opacity h-full py-2"
      >
        <Image
          src="/assets/logo/logo_v1.png"
          alt="Aethelgard Logo"
          width={150}
          height={150}
          className=" object-cover"
          priority
        />
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <Link href="/dashboard" className="underline">
              Dashboard
            </Link>
            <Link href="/research" className="underline">
              Forschung
            </Link>
            <Link href="/army" className="underline">
              Armee
            </Link>
            <Link href="/world" className="underline">
              Welt
            </Link>
            <Link href="/reports" className="underline">
              Berichte
            </Link>
            <button
              onClick={async () => {
                await signOut(auth);
              }}
              className="ui-button px-2 py-1"
              aria-label="Logout"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/auth/signin" className="underline">
              Login
            </Link>
            <Link href="/auth/signup" className="underline">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
