import { onSchedule } from "firebase-functions/v2/scheduler";

import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Definiere die Produktionsraten pro Level für jedes Gebäude / hour
const PRODUCTION_RATES = {
  farm: 1000,
  sawmill: 1000,
  quarry: 800,
  manamine: 500,
};

/**
 * Eine geplante Cloud Function, die alle 5 Minuten ausgeführt wird.
 * Sie berechnet die Ressourcenproduktion für alle Städte seit dem letzten Tick.
 */
export const gameTick = onSchedule("every 5 minutes", async () => {
  const now = admin.firestore.Timestamp.now();
  const citiesRef = db.collection("cities");
  const snapshot = await citiesRef.get();

  if (snapshot.empty) {
    console.log("No cities found. Skipping tick.");
    return;
  }

  const batch = db.batch();
  let updatedCities = 0;

  snapshot.forEach(doc => {
    const city = doc.data();
    const cityRef = doc.ref;

    // Zeit seit dem letzten Update in Stunden berechnen
    const lastUpdated = city.lastUpdated || now;
    const hoursPassed = (now.seconds - lastUpdated.seconds) / 3600;

    if (hoursPassed <= 0) {
      return;
    }

    // Neue Ressourcen berechnen
    const newFood = city.resources.food + (city.buildings.farm * PRODUCTION_RATES.farm * hoursPassed);
    const newWood = city.resources.wood + (city.buildings.sawmill * PRODUCTION_RATES.sawmill * hoursPassed);
    const newStone = city.resources.stone + (city.buildings.quarry * PRODUCTION_RATES.quarry * hoursPassed);
    const newMana = city.resources.mana + (city.buildings.manamine * PRODUCTION_RATES.manamine * hoursPassed);

    // TODO: Lagerkapazität implementieren und prüfen
    // const maxStorage = city.storageCapacity;
    // finalFood = Math.min(newFood, maxStorage);

    // Update-Operation zum Batch hinzufügen
    batch.update(cityRef, {
      "resources.food": newFood,
      "resources.wood": newWood,
      "resources.stone": newStone,
      "resources.mana": newMana,
      "lastUpdated": now, // Den Zeitpunkt des Updates speichern
    });
    updatedCities++;
  });

  // Alle Updates in einer einzigen Transaktion ausführen
  await batch.commit();

  console.log(`Game tick executed. Updated ${updatedCities} cities.`);
});
