import React from "react";
import { Eye, AlertTriangle } from "lucide-react";
import { SpyReport } from "@/types";

interface SpyReportProps {
  reportData: SpyReport;
  attackerName?: string;
  defenderName?: string;
}

export const CompactSpyReport: React.FC<SpyReportProps> = ({
  reportData,
  attackerName = "Angreifer",
  defenderName = "Verteidiger",
}) => {
  return (
    <div className="compact-spy-report bg-gray-800 rounded-lg p-4 max-w-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Spionagebericht
        </h3>
        <span className="text-sm text-gray-400">
          {attackerName} vs {defenderName}
        </span>
      </div>

      {reportData.spiesLost > 0 && (
        <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded px-3 py-1.5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">
            {reportData.spiesLost} Spion(e) verloren!
          </span>
        </div>
      )}

      <div
        className={`text-center py-2 px-3 rounded ${
          reportData.success
            ? "bg-green-900/30 text-green-400"
            : "bg-red-900/30 text-red-400"
        }`}
      >
        <p className="font-semibold">
          {reportData.success
            ? "Spionage erfolgreich"
            : "Spionage fehlgeschlagen"}
        </p>
      </div>
    </div>
  );
};
