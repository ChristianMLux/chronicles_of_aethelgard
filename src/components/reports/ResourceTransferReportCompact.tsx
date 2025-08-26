import { formatNumber } from "@/lib/utils";
import { ResourceKey, ResourceTransferReport } from "@/types";
import { Package } from "lucide-react";

interface TransferReportProps {
  reportData: ResourceTransferReport;
  isReceiver?: boolean;
}

export const CompactTransferReport: React.FC<TransferReportProps> = ({
  reportData,
  isReceiver = false,
}) => {
  const getTotalResources = () => {
    return Object.values(reportData.resources).reduce(
      (sum, amount) => sum + (amount || 0),
      0
    );
  };

  const resourceIcons: Record<ResourceKey, string> = {
    stone: "🪨",
    wood: "🪵",
    food: "🍎",
    mana: "💎",
  };

  return (
    <div className="compact-transfer-report bg-gray-800 rounded-lg p-4 max-w-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Package className="w-4 h-4" />
          {isReceiver ? "Ressourcen erhalten" : "Ressourcen gesendet"}
        </h3>
        <span
          className={`text-sm ${
            reportData.success ? "text-green-400" : "text-red-400"
          }`}
        >
          {reportData.success ? "Erfolgreich" : "Fehlgeschlagen"}
        </span>
      </div>

      {reportData.success && (
        <>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-gray-400">{isReceiver ? "Von:" : "An:"}</span>
            <span className="text-white font-semibold">
              {isReceiver ? reportData.senderName : reportData.receiverName}
            </span>
          </div>

          <div className="flex gap-3 text-sm">
            {Object.entries(reportData.resources).map(([resource, amount]) => {
              if (!amount || amount === 0) return null;
              const resourceKey = resource as ResourceKey;

              return (
                <div key={resource} className="flex items-center gap-1">
                  <span>{resourceIcons[resourceKey]}</span>
                  <span
                    className={
                      isReceiver ? "text-green-400" : "text-yellow-400"
                    }
                  >
                    {isReceiver ? "+" : "-"}
                    {formatNumber(amount)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Gesamt:</span>
              <span
                className={`font-bold ${
                  isReceiver ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {isReceiver ? "+" : "-"}
                {formatNumber(getTotalResources())}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
