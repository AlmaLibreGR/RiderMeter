import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // `prisma generate` does not need a live database connection, so keep config
    // build-friendly even when DATABASE_URL is injected only at runtime.
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/ridermeter",
  },
});
