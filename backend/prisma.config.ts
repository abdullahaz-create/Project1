import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Uses DATABASE_URL from Vercel environment variables at build+runtime.
    // Falls back to a dummy URL only so `prisma generate` doesn't crash
    // in environments where DATABASE_URL isn't set (e.g. local CI).
    url: process.env.DATABASE_URL
      ? env("DATABASE_URL")
      : "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
