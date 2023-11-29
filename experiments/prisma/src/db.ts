import { PrismaClient, Prisma } from "npm:@prisma/client";

import { Resource } from "lib/resource/mod.ts";

export function createPrisma() {
  return new Resource({
    async init() {
      const prisma = new PrismaClient();

      await prisma.$connect();

      return prisma;
    },
    async deInit(Pr) {
      await Pr.$disconnect();
    },
  });
}

export { Prisma };
