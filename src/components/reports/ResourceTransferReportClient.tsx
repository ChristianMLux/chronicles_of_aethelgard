import React from "react";
import { Package, ArrowRight, CheckCircle, User } from "lucide-react";
import { ResourceKey, ResourceTransferReport } from "@/types";
import { formatNumber } from "@/lib/utils";

interface TransferReportProps {
  reportData: ResourceTransferReport;
  isReceiver?: boolean;
}

// ============= FULL REPORT COMPONENT =============
export const TransferReportClient: React.FC<TransferReportProps> = ({
  reportData,
  isReceiver = false,
}) => {
  const resourceNames: Record<ResourceKey, string> = {
    stone: "Stein",
    wood: "Holz",
    food: "Nahrung",
    mana: "Mana",
  };

  const resourceIcons: Record<ResourceKey, string> = {
    stone: "🪨",
    wood: "🪵",
    food: "🍎",
    mana: "💎",
  };

  const getTotalResources = () => {
    return Object.values(reportData.resources).reduce(
      (sum, amount) => sum + (amount || 0),
      0
    );
  };

  return (
    <div className="bg-gray-900 text-white rounded-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Package className="w-6 h-6" />
          {isReceiver ? "Ressourcen Erhalten" : "Ressourcentransport"}
          <Package className="w-6 h-6" />
        </h2>
        <p className="text-gray-400">
          {reportData.success ? "Erfolgreich abgeschlossen" : "Fehlgeschlagen"}
        </p>
      </div>

      {reportData.success ? (
        <>
          {/* Transfer Direction */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <User className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <p className="font-semibold">
                  {isReceiver ? reportData.senderName || "Unbekannt" : "Du"}
                </p>
                {!isReceiver && (
                  <p className="text-sm text-gray-400">
                    {reportData.senderCityId}
                  </p>
                )}
              </div>

              <ArrowRight className="w-8 h-8 text-green-400 mx-4" />

              <div className="text-center flex-1">
                <User className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="font-semibold">
                  {isReceiver ? "Du" : reportData.receiverName || "Unbekannt"}
                </p>
                {!isReceiver && (
                  <p className="text-sm text-gray-400">
                    {reportData.receiverCityId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Resources Transferred */}
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-green-400">
                {isReceiver ? "Erhaltene Ressourcen" : "Gesendete Ressourcen"}
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(reportData.resources).map(
                ([resource, amount]) => {
                  if (!amount || amount === 0) return null;
                  const resourceKey = resource as ResourceKey;

                  return (
                    <div
                      key={resource}
                      className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {resourceIcons[resourceKey]}
                        </span>
                        <div>
                          <p className="text-sm text-gray-400">
                            {resourceNames[resourceKey]}
                          </p>
                          <p className="font-bold text-lg">
                            {isReceiver ? "+" : "-"}
                            {formatNumber(amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Gesamt:</span>
                <span className="text-xl font-bold text-green-400">
                  {isReceiver ? "+" : "-"}
                  {formatNumber(getTotalResources())}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 text-center">
          <p className="text-red-400">
            Der Ressourcentransport konnte nicht abgeschlossen werden.
          </p>
        </div>
      )}
    </div>
  );
};

// ============= COMPACT REPORT COMPONENT =============
