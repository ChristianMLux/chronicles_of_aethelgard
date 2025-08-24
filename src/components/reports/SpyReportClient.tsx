import React from "react";
import {
  Eye,
  FileText,
  Package,
  Users,
  Building,
  FlaskConical,
} from "lucide-react";
import { SpyReport, UnitKey } from "@/types";
import { UNITS } from "@/config/units.config";
import { formatNumber } from "@/lib/utils";

interface SpyReportProps {
  reportData: SpyReport;
  attackerName?: string;
  defenderName?: string;
}

export const SpyReportClient: React.FC<SpyReportProps> = ({
  reportData,
  attackerName = "Angreifer",
  defenderName = "Verteidiger",
}) => {
  const unitNames = UNITS;

  const renderSection = (
    title: string,
    data: Record<string, number> | undefined,
    icon: React.ReactNode,
    nameMapping?: Record<string, { name: string }>
  ) => {
    if (!data || Object.values(data).every((v) => v === 0 || v === undefined)) {
      return null;
    }

    return (
      <div className="border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          {Object.entries(data).map(([key, value]) => {
            if (value === 0 || value === undefined) return null;
            const displayName =
              nameMapping?.[key as UnitKey]?.name ||
              key.charAt(0).toUpperCase() + key.slice(1);
            return (
              <div
                key={key}
                className="flex justify-between items-center bg-gray-800/50 p-2 rounded"
              >
                <span className="text-gray-300">{displayName}</span>
                <span className="font-mono text-green-400">
                  {formatNumber(value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 text-white rounded-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <FileText className="w-6 h-6" />
          Spionagebericht
          <Eye className="w-6 h-6" />
        </h2>
        <p className="text-gray-400">
          {attackerName} vs {defenderName}
        </p>
      </div>

      <div
        className={`mb-6 p-4 rounded-lg text-center ${
          reportData.success
            ? "bg-green-900/30 border border-green-700"
            : "bg-red-900/30 border border-red-700"
        }`}
      >
        <h3 className="text-xl font-bold mb-2">
          {reportData.success
            ? "🎉 Spionage Erfolgreich! 🎉"
            : "🛡️ Spionage Fehlgeschlagen! 🛡️"}
        </h3>
        <div className="mt-4 text-sm">
          <p className="text-gray-400 mb-1">Verlorene Spione:</p>
          <p className="font-bold text-red-400">{reportData.spiesLost}</p>
        </div>
      </div>

      {reportData.success && (
        <div className="space-y-4">
          {renderSection(
            "Ressourcen",
            reportData.targetResources,
            <Package className="w-5 h-5" />
          )}
          {renderSection(
            "Armee",
            reportData.targetArmy,
            <Users className="w-5 h-5" />,
            unitNames
          )}
          {renderSection(
            "Gebäude",
            reportData.targetBuildings,
            <Building className="w-5 h-5" />
          )}
          {renderSection(
            "Forschung",
            reportData.targetResearch,
            <FlaskConical className="w-5 h-5" />
          )}
        </div>
      )}
    </div>
  );
};
