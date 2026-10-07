import { PrismaClient, Prisma } from '@prisma/client';
export const prisma = new PrismaClient();
export type Tx = Prisma.TransactionClient;
export const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
// Serialize the small private MVP economy across processes. PostgreSQL releases this
// transaction-scoped lock on commit, rollback, process crash or disconnection.
export async function atomic<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
 return prisma.$transaction(async tx => {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(73105241)`;
  return fn(tx);
 }, {maxWait: 15000, timeout: 30000});
}
