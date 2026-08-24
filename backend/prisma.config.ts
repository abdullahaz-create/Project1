import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Fallback dummy URL allows `prisma generate` to succeed at build time
    // without DATABASE_URL being set. The real URL is injected at runtime
    // via the Vercel Environment Variable DATABASE_URL.
    url: process.env.DATABASE_URL
      ? env("DATABASE_URL")
      : "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
