import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

const PRODUCTION_RATES = {
  farm: 100000,
  sawmill: 10000,
  quarry: 60000,
  manamine: 40000,
};

export const resourceTick = functions.https.onRequest(async (req, res) => {
  try {
    const usersSnapshot = await db.collection("users").get();
    let totalUpdatedCities = 0;
    const batch = db.batch();

    for (const userDoc of usersSnapshot.docs) {
      const citiesSnapshot = await userDoc.ref.collection("cities").get();

      if (citiesSnapshot.empty) {
        continue;
      }

      citiesSnapshot.forEach((cityDoc) => {
        const city = cityDoc.data();
        const cityRef = cityDoc.ref;

        const now = admin.firestore.Timestamp.now();
        const lastUpdated = city.lastTickAt || now; 
        
        const secondsPassed = now.seconds - lastUpdated.seconds;
        if (secondsPassed <= 0) {
          return;
        }
        const hoursPassed = secondsPassed / 3600;

        const farmLevel = city.buildings?.farm ?? 0;
        const sawmillLevel = city.buildings?.sawmill ?? 0;
        const quarryLevel = city.buildings?.quarry ?? 0;
        const manamineLevel = city.buildings?.manamine ?? 0;

        const foodProduction = farmLevel * PRODUCTION_RATES.farm * hoursPassed;
        const woodProduction = sawmillLevel * PRODUCTION_RATES.sawmill * hoursPassed;
        const stoneProduction = quarryLevel * PRODUCTION_RATES.quarry * hoursPassed;
        const manaProduction = manamineLevel * PRODUCTION_RATES.manamine * hoursPassed;

        const currentFood = city.resources?.food ?? 0;
        const currentWood = city.resources?.wood ?? 0;
        const currentStone = city.resources?.stone ?? 0;
        const currentMana = city.resources?.mana ?? 0;

        let newFood = Math.floor(currentFood + foodProduction);
        let newWood = Math.floor(currentWood + woodProduction);
        let newStone = Math.floor(currentStone + stoneProduction);
        let newMana = Math.floor(currentMana + manaProduction);

        newFood = Math.min(newFood, city.capacity?.food ?? newFood);
        newWood = Math.min(newWood, city.capacity?.wood ?? newWood);
        newStone = Math.min(newStone, city.capacity?.stone ?? newStone);
        newMana = Math.min(newMana, city.capacity?.mana ?? newMana);

        batch.update(cityRef, {
          "resources.food": newFood,
          "resources.wood": newWood,
          "resources.stone": newStone,
          "resources.mana": newMana,
          "lastTickAt": now,
        });
        totalUpdatedCities++;
      });
    }

    await batch.commit();
    const successMessage = `Game tick executed. Updated ${totalUpdatedCities} cities.`;
    console.log(successMessage);
    res.status(200).send({ status: "success", message: successMessage });

  } catch (error) {
    console.error("Error executing game tick:", error);
    res.status(500).send({ status: "error", message: "Internal Server Error" });
  }
});