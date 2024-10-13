import { defineConfig } from "drizzle-kit";
import "@/drizzle/config";

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is missing");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
  verbose: true,
  strict: true,
});
