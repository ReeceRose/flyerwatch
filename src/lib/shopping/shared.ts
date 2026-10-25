import type { Deal } from "@/lib/flipp";
import * as list from "@/shared/list";
import * as match from "@/shared/match";
import * as pantry from "@/shared/pantry";
import * as planner from "@/shared/planner";
import * as state from "@/shared/state";

export type Trip = { maxStores: number; compareAnywhere: boolean; includeSimilar: boolean };
export type ShoppingSettings = { postal: string | null; stores: string[]; trip: Trip };

export type ListRecipe = {
  id: string;
  title: string;
  url: string;
  site: string;
  imageUrl: string | null;
  ingredients: string[];
  addedAt: string;
};

export type ShoppingList = {
  recipes: ListRecipe[];
  extras: string[];
  checked: string[];
  removed: string[];
  notAt: Record<string, string[]>;
};

export type RankedDeal = Deal & { tier: number };
export type Amount = { quantity: number | null; unit: string | null };
export type SkipReason = "staple" | "pantry";

export type ListItem = {
  key: string;
  term: string;
  skipped: SkipReason | null;
  uses: { source: string | null; line: string; amount: string | null }[];
  sources: string[];
  amount: Amount;
};

export type PlanItem = { key: string; deals: RankedDeal[]; amount: Amount };

export type Plan = {
  stores: string[];
  covered: number;
  total: number;
  guesses: number;
  assignments: Record<string, RankedDeal | null>;
};

export type Estimate = { amount: number; guess: boolean; assumed: string | null };

export const DEFAULT_SETTINGS: ShoppingSettings = state.DEFAULT_SETTINGS;
export const EMPTY_LIST: ShoppingList = state.EMPTY_LIST;
export const BRIDGE: { page: string; extension: string } = state.BRIDGE;
export const normalizeTrip: (trip: Partial<Trip> | null) => Trip = state.normalizeTrip;
export const normalizeList: (list: Partial<ShoppingList> | null) => ShoppingList = state.normalizeList;

export const buildItems: (recipes: ListRecipe[], extras: string[], pantry: string[]) => ListItem[] = list.buildItems;
export const describeNeed: (item: ListItem) => string | null = list.describeNeed;
export const rankDeals: (deals: Deal[], term: string, groceryFlyerIds: Set<number> | null) => RankedDeal[] =
  match.rankDeals;
export const cleanPantry: (items: string[]) => string[] = pantry.cleanPantry;
export const normalizeItem: (value: string) => string = pantry.normalizeItem;
export const pantryMatch: (term: string, items: string[]) => string | null = pantry.pantryMatch;
export const estimateCost: (deal: Deal, amount: Amount, term?: string) => Estimate | null = planner.estimateCost;
export const planTrips: (
  items: PlanItem[],
  settings: { stores: string[]; trip: Trip },
) => { yours: Plan | null; anywhere: Plan | null } = planner.planTrips;
