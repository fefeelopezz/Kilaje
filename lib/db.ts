import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

// Un solo cliente aunque `next dev` recargue los módulos.
const g = globalThis as { db?: PrismaClient };

export const db = (g.db ??= new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
}));
