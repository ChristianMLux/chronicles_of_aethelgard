"use client";
import Link from "next/link";
import { getFirebaseAuth } from "../../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Nav() {
  const auth = getFirebaseAuth();
  const [user] = useAuthState(auth);
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 w-full z-50 h-18 p-4 flex items-center justify-between ui-nav text-white/90">
      <Link
        href="/"
        className="flex items-center gap-2 hover:opacity-90 transition-opacity h-full py-2"
      >
        <Image
          src="/assets/logo/logo_v1.png"
          alt="Aethelgard Logo"
          width={150}
          height={150}
          className="object-cover"
          priority
        />
      </Link>
      <div className="flex items-center gap-6 text-sm font-medium">
        {user ? (
          <>
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/world">Welt</NavLink>
            <NavLink href="/reports">Berichte</NavLink>
            <button
              onClick={async () => {
                await signOut(auth);
                window.location.href = "/auth/signin";
              }}
              className="ui-button px-4 py-2 text-xs"
              aria-label="Logout"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink href="/auth/signin">Login</NavLink>
            <Link href="/auth/signup" className="ui-button px-4 py-2 text-xs">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`hover:text-white transition-colors pb-1 ${
        isActive ? "text-white border-b border-rune" : "text-white/70"
      }`}
    >
      {children}
    </Link>
  );
}
