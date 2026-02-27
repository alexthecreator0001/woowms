import { PrismaClient } from '@prisma/client';

// Shared Prisma singleton — use this for non-tenant operations (auth, webhooks, cron)
const prisma = new PrismaClient();

/**
 * Returns a Prisma client that auto-injects tenantId into every query.
 * Covers findMany, findFirst, findUnique, count, create, update, delete, etc.
 */
export function tenantPrisma(tenantId) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query, model }) {
          if (hasTenantId(model)) args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query, model }) {
          if (hasTenantId(model)) args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query, model }) {
          // findUnique uses unique fields — we can't inject tenantId into where
          // but we verify after fetch
          const result = await query(args);
          if (result && hasTenantId(model) && result.tenantId !== tenantId) {
            return null; // belongs to another tenant
          }
          return result;
        },
        async count({ args, query, model }) {
          if (hasTenantId(model)) args.where = { ...args.where, tenantId };
          return query(args);
        },
        async create({ args, query, model }) {
          if (hasTenantId(model)) args.data = { ...args.data, tenantId };
          return query(args);
        },
        async createMany({ args, query, model }) {
          if (hasTenantId(model)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((d) => ({ ...d, tenantId }));
            } else {
              args.data = { ...args.data, tenantId };
            }
          }
          return query(args);
        },
        async update({ args, query, model }) {
          // For update, verify ownership by adding tenantId to where if possible
          if (hasTenantId(model)) args.where = { ...args.where, tenantId };
          return query(args);
        },
        async updateMany({ args, query, model }) {
          if (hasTenantId(model)) args.where = { ...args.where, tenantId };
          return query(args);
        },
        async delete({ args, query, model }) {
          if (hasTenantId(model)) args.where = { ...args.where, tenantId };
          return query(args);
        },
        async deleteMany({ args, query, model }) {
          if (hasTenantId(model)) args.where = { ...args.where, tenantId };
          return query(args);
        },
      },
    },
  });
}

// Models that have a tenantId column
const TENANT_MODELS = new Set(['User', 'Store', 'Warehouse', 'PurchaseOrder']);

function hasTenantId(model) {
  return TENANT_MODELS.has(model);
}

export default prisma;
