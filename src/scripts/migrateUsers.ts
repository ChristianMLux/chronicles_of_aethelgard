import "dotenv/config";
import admin from "firebase-admin";

// ==================== CONFIGURATION ====================
// Set to false to actually write changes to the database.
// In dry run mode, the script will only log what it would do.
const DRY_RUN = false;

// ==================== TYPE DEFINITIONS ====================
// These should match your actual types.ts file for consistency.
interface Location {
  region: string;
  continent: string;
  territory: string;
  continentName: string;
  territoryName: string;
}

interface Tile {
  id: string;
  coords: { x: number; y: number };
  location: Location;
  type: "empty" | "city" | "resource" | "npc_camp" | "ruins";
  zone: "outer" | "middle" | "center";
  ownerId?: string;
  cityId?: string;
}

interface City {
  id: string;
  name: string;
  ownerId: string;
  tileId?: string;
  location: Location;
}

// ==================== CORE MIGRATION LOGIC ====================
async function migrateUsers() {
  console.log("🚀 Starting user migration script...");
  if (DRY_RUN) {
    console.log(
      "\n⚠️  WARNING: Running in DRY RUN mode. No changes will be saved to the database.\n"
    );
  }

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.error(
      "Firebase Admin credentials not found in environment variables."
    );
    return;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
  const db = admin.firestore();

  try {
    // 1. Fetch all available starting tiles from the new world
    console.log("1. Fetching available starting tiles from the new world...");
    const emptyTilesSnapshot = await db
      .collection("world")
      .where("type", "==", "empty")
      .where("zone", "==", "outer")
      .get();

    const availableTiles = emptyTilesSnapshot.docs.map(
      (doc) => doc.data() as Tile
    );
    console.log(`   Found ${availableTiles.length} available starting tiles.`);

    if (availableTiles.length === 0) {
      console.error("❌ No available empty tiles found. Cannot migrate users.");
      return;
    }

    // 2. Fetch all users
    console.log("\n2. Fetching all users...");
    const usersSnapshot = await db.collection("users").get();
    const users = usersSnapshot.docs;
    console.log(`   Found ${users.length} users to process.`);

    // 3. Iterate through each user and their cities
    console.log("\n3. Starting migration process for each user...");
    for (const userDoc of users) {
      const userId = userDoc.id;
      const username = userDoc.data().username || userId;
      console.log(`\n   Processing user: ${username} (ID: ${userId})`);

      const citiesRef = userDoc.ref.collection("cities");
      const citiesSnapshot = await citiesRef.get();

      if (citiesSnapshot.empty) {
        console.log("     - User has no cities to migrate. Skipping.");
        continue;
      }

      for (const cityDoc of citiesSnapshot.docs) {
        const city = cityDoc.data() as City;
        console.log(`     - Migrating city: ${city.name} (ID: ${city.id})`);

        if (availableTiles.length === 0) {
          console.error(
            `     ❌ ERROR: Ran out of available tiles. Cannot migrate city ${city.name}.`
          );
          continue;
        }

        const newTile = availableTiles.pop()!;
        console.log(
          `       - Assigning new tile ID: ${newTile.id} at (${newTile.coords.x}, ${newTile.coords.y})`
        );

        if (!DRY_RUN) {
          const batch = db.batch();

          const cityRef = cityDoc.ref;
          batch.update(cityRef, {
            tileId: newTile.id,
            location: newTile.location,
          });

          const tileRef = db.collection("world").doc(newTile.id);
          batch.update(tileRef, {
            type: "city",
            ownerId: userId,
            cityId: city.id,
          });

          await batch.commit();
          console.log("       ✅ Successfully updated database.");
        } else {
          console.log(
            "       - [Dry Run] Would update city with new tileId and location."
          );
          console.log(
            "       - [Dry Run] Would update world tile with ownerId and cityId."
          );
        }
      }
    }

    console.log("\n\n✅ Migration script finished!");
    if (DRY_RUN) {
      console.log(
        "Remember, this was a dry run. To apply changes, set DRY_RUN to false and run again."
      );
    }
  } catch (error) {
    console.error("\n❌ An error occurred during migration:", error);
  }
}

migrateUsers();
