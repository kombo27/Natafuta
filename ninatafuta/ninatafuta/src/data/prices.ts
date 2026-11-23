import type { Currency } from '../types';

// Appendix B – placeholder values. Real prices must come from market research.
export interface PriceTable {
  boost3: number;
  boost7: number;
  payFeeRate: number;
  payFeeMin: number;
  bodaBase: number;
  bodaPerKm: number;
  bus: number;
  shopMonth: number;
  banner7: number;
  banner30: number;
  round: number; // rounding step for delivery fees
}

export const PRICES: Record<Currency, PriceTable> = {
  KES: { boost3: 100, boost7: 250, payFeeRate: 0.02, payFeeMin: 50, bodaBase: 100, bodaPerKm: 20, bus: 500, shopMonth: 1000, banner7: 500, banner30: 1500, round: 10 },
  TZS: { boost3: 2000, boost7: 5000, payFeeRate: 0.02, payFeeMin: 1000, bodaBase: 2000, bodaPerKm: 400, bus: 10000, shopMonth: 20000, banner7: 10000, banner30: 30000, round: 100 },
  UGX: { boost3: 3000, boost7: 8000, payFeeRate: 0.02, payFeeMin: 1500, bodaBase: 3000, bodaPerKm: 600, bus: 15000, shopMonth: 30000, banner7: 15000, banner30: 45000, round: 100 },
};

export const BODA_MAX_KM = 60;
export const BODA_PARTNERS = ['Haraka Boda', 'Pikipiki Express'];
