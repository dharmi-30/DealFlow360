import { parseSchemaSqlSeedData } from '../lib/sqlSeedParser';

// Parse datasets dynamically from schema.sql INSERT queries
const parsedSeed = parseSchemaSqlSeedData();

export const INITIAL_CUSTOMERS = parsedSeed.customers;
export const INITIAL_PRODUCTS = parsedSeed.products;
export const INITIAL_QUOTATIONS = parsedSeed.quotations;
export const INITIAL_APPROVALS = parsedSeed.approvals;
export const INITIAL_FULFILLMENT = parsedSeed.fulfillments;
export const INITIAL_SUBSCRIPTIONS = parsedSeed.subscriptions;
export const INITIAL_INVOICES = parsedSeed.invoices;
export const INITIAL_DEAL_HEALTH = parsedSeed.dealHealthScores;
