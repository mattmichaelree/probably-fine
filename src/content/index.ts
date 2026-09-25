// One place that merges per-scene content. Food and clue ids are unique across scenes.
import { BBQ_CLUES, BBQ_ENDINGS, BBQ_FOODS } from './bbq.ts';
import { BISCUIT_CLUES, BISCUIT_ENDINGS, BISCUIT_FOODS } from './biscuit.ts';
import { DATE_CLUES, DATE_ENDINGS, DATE_FOODS } from './date.ts';
import { TRUCK_CLUES, TRUCK_ENDINGS, TRUCK_FOODS } from './morning.ts';
import { GROCERY_CLUES, GROCERY_ENDINGS, GROCERY_FOODS } from './grocery.ts';
import { PIZZA_CLUES, PIZZA_ENDINGS, PIZZA_FOODS } from './pizza.ts';

export * from './bbq.ts';
export * from './biscuit.ts';
export * from './date.ts';
export * from './grocery.ts';
export * from './morning.ts';
export * from './pharmacy.ts';
export * from './pizza.ts';
export const FOODS = { ...GROCERY_FOODS, ...BBQ_FOODS, ...DATE_FOODS, ...BISCUIT_FOODS, ...TRUCK_FOODS, ...PIZZA_FOODS };
export const CLUES = { ...GROCERY_CLUES, ...BBQ_CLUES, ...DATE_CLUES, ...BISCUIT_CLUES, ...TRUCK_CLUES, ...PIZZA_CLUES };
export const ENDINGS: Record<string, Record<string, { title: string; sub: string; detour?: string }>> = {
  grocery: GROCERY_ENDINGS, bbq: BBQ_ENDINGS, date: DATE_ENDINGS, biscuit: BISCUIT_ENDINGS, truck: TRUCK_ENDINGS, pizza: PIZZA_ENDINGS,
};
