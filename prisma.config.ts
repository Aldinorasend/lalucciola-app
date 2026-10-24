import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // process.env, not env(): `prisma generate` runs on npm install, before .env exists
    url: process.env.DATABASE_URL,
  },
});
