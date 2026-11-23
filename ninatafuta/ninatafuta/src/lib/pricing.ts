import type { Currency, DeliveryType } from '../types';
import { BODA_MAX_KM, PRICES } from '../data/prices';

export function payFee(price: number, currency: Currency): number {
  const p = PRICES[currency];
  return Math.max(Math.round(price * p.payFeeRate), p.payFeeMin);
}

export function deliveryFee(type: DeliveryType, distance: number, currency: Currency): number {
  const p = PRICES[currency];
  if (type === 'pickup') return 0;
  if (type === 'bus') return p.bus;
  const raw = p.bodaBase + p.bodaPerKm * distance;
  return Math.round(raw / p.round) * p.round;
}

/** Boda boda up to 60 km, bus parcel beyond. */
export function deliveryOptions(distance: number): DeliveryType[] {
  return distance <= BODA_MAX_KM ? ['pickup', 'boda'] : ['pickup', 'bus'];
}

export interface PayQuote {
  price: number;
  deliveryFee: number;
  payFee: number;
  total: number;
}

export function quote(price: number, currency: Currency, type: DeliveryType, distance: number): PayQuote {
  const d = deliveryFee(type, distance, currency);
  const f = payFee(price, currency);
  return { price, deliveryFee: d, payFee: f, total: price + d + f };
}
