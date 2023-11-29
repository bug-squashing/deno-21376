import { createPrisma, Prisma } from "lib/db/mod.ts";

export const Pr = createPrisma();

export const data: Prisma.UserCreateInput[] = [
  {
    name: "Jenny",
  },
  {
    name: "Don Quixote",
  },
  {
    name: "Jordan",
  },
  {
    name: "Reuben",
  },
];
