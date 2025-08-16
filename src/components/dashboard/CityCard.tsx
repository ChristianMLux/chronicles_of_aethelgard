import { DocumentData } from "firebase/firestore";
import { Clock, Link } from "lucide-react";
interface City extends DocumentData {
  id: string;
  name: string;
  continent: string;
  region: string;
  buildQueue?: {
    [key: string]: {
      name: string;
      targetLevel: number;
      duration: number;
    };
  };
}
export const CityCard = ({ city }: { city: City }) => (
  <div className="bg-panel-2/50 p-3 rounded-lg border border-outline/50 hover:border-rune/70 transition-colors">
    <h3 className="font-bold text-base">{city.name}</h3>
    <p className="text-xs text-gray-400">
      {city.region}, {city.continent}
    </p>
    <div className="mt-2 text-xs">
      {city.buildQueue && Object.keys(city.buildQueue).length > 0 ? (
        Object.values(city.buildQueue).map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <Clock size={12} className="text-yellow-400" />
            <span>
              {item.name} (Lvl {item.targetLevel})
            </span>
          </div>
        ))
      ) : (
        <p className="text-gray-500 italic">Keine Bauaufträge</p>
      )}
    </div>
    <Link
      href={`/city/${city.id}`}
      className="ui-button text-xs px-3 py-1 mt-3 block text-center"
    >
      Verwalten
    </Link>
  </div>
);
