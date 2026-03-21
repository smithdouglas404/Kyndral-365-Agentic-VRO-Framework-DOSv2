/**
 * DATABASE STUB
 *
 * PostgreSQL has been removed. All data comes from Palantir Foundry.
 * This file provides a no-op stub for compatibility.
 */

// Mock pool that does nothing
export const pool = {
  query: async () => ({ rows: [] }),
  connect: async () => ({
    query: async () => ({ rows: [] }),
    release: () => {},
  }),
  end: async () => {},
  on: () => {},
};

// Mock drizzle db that returns empty results
export const db = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve([]),
        orderBy: () => Promise.resolve([]),
        execute: () => Promise.resolve([]),
      }),
      limit: () => Promise.resolve([]),
      orderBy: () => Promise.resolve([]),
      execute: () => Promise.resolve([]),
    }),
    execute: () => Promise.resolve([]),
  }),
  insert: () => ({
    values: () => ({
      returning: () => Promise.resolve([]),
      execute: () => Promise.resolve([]),
      onConflictDoUpdate: () => ({
        returning: () => Promise.resolve([]),
      }),
    }),
  }),
  update: () => ({
    set: () => ({
      where: () => ({
        returning: () => Promise.resolve([]),
        execute: () => Promise.resolve([]),
      }),
    }),
  }),
  delete: () => ({
    where: () => ({
      returning: () => Promise.resolve([]),
      execute: () => Promise.resolve([]),
    }),
  }),
  execute: async () => ({ rows: [] }),
  transaction: async (fn: any) => fn(db),
  query: {
    users: { findFirst: async () => null, findMany: async () => [] },
  },
};

console.log('[DB] PostgreSQL removed - using Palantir as data source');
