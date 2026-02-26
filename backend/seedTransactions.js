require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function seedTransactions() {
  console.log("Connecting to database...");
  const client = await pool.connect();
  try {
    console.log("Fetching valid device IDs from deviceRelationInfo...");
    const deviceRes = await client.query(
      'SELECT "deviceId" FROM "deviceRelationInfo" LIMIT 10',
    );
    const deviceIds = deviceRes.rows.map((r) => r.deviceId);

    if (deviceIds.length === 0) {
      console.error(
        "No valid device IDs found in deviceRelationInfo. Seeding cannot proceed.",
      );
      return;
    }

    console.log(
      `Found ${deviceIds.length} device IDs. Seeding 100 transactions...`,
    );

    // Clean existing transactions to have a fresh start for testing
    await client.query('DELETE FROM "transactionInfo"');

    for (let i = 0; i < 100; i++) {
      const deviceId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
      const amount = (Math.random() * 5000 + 10).toFixed(2);
      const rrn = Math.random().toString().slice(2, 14).padEnd(12, "1");
      const transactionType = Math.floor(Math.random() * 3) + 1; // 1, 2, 3
      const transactionMode = Math.floor(Math.random() * 2) + 1; // 1, 2
      const now = Date.now();
      const offset = Math.floor(Math.random() * 86400000 * 7); // Randomly over the last 7 days
      const time = now - offset;
      const txnTime = new Date(time).toISOString();
      const reqRefNo =
        "TXN" + Math.random().toString(36).substring(2, 10).toUpperCase();
      const expirationTime = BigInt(time) + BigInt(3600000);

      await client.query(
        `
            INSERT INTO "transactionInfo" (
                "reqRefNo", "rrn", "transactionType", "messageOriginType", 
                "transactionMode", "amount", "txnTime", "time", 
                "deviceId", "expirationTime", "audioPlayed", "createdAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        `,
        [
          reqRefNo,
          rrn,
          transactionType,
          0, // messageOriginType
          transactionMode,
          amount,
          txnTime,
          BigInt(time),
          deviceId,
          expirationTime,
          1, // audioPlayed
        ],
      );
    }

    console.log("Database seeded with 100 transactions successfully!");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedTransactions();
