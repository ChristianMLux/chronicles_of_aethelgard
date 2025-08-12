"use client";
import { useEffect, useMemo, useState } from "react";
import { getDb } from "../../../firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import Link from "next/link";

type Report = { type: string; message: string; createdAt?: { seconds: number } };

export default function ReportsPage() {
  const db = useMemo(() => getDb(), []);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    (async () => {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setReports(snap.docs.map((d) => d.data() as Report));
    })();
  }, [db]);

  return (
    <div className="p-6 flex flex-col gap-4">
      <Link className="underline" href="/dashboard">← Zurück</Link>
      <h1 className="text-2xl font-semibold">Berichte</h1>
      <div className="grid gap-2">
        {reports.map((r, i) => (
          <div key={i} className="border rounded p-3 text-sm">
            <div className="font-medium">{r.type}</div>
            <div>{r.message}</div>
          </div>
        ))}
        {reports.length === 0 && <div>Keine Berichte vorhanden.</div>}
      </div>
    </div>
  );
}


