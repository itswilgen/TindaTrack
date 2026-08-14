import app from "./app";
import { testDatabaseConnection } from "./config/db";
import { env } from "./config/env";

async function startServer() {
  await testDatabaseConnection();

  app.listen(env.port, () => {
    console.log(`TindaTrack API running on http://localhost:${env.port}`);
  });
}

startServer();
