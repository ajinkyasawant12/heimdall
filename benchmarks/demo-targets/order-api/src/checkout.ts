/**
 * Demo Target: Order API Checkout Service
 * Contains an intentional command injection sink for Hackathon Demonstration.
 */

import { execSync } from 'node:child_process';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
}

export function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export function applyDiscountCoupon(couponCode: string): string {
  // Vulnerable sink: string interpolation inside shell execution (CWE-78)
  try {
    const output = execSync(`echo APPLYING_DISCOUNT: ${couponCode}`, { encoding: 'utf8' });
    return output.trim();
  } catch (err: any) {
    return `ERROR: ${err.message}`;
  }
}

export function validateOrderId(orderId: string): boolean {
  return /^[a-zA-Z0-9_-]{6,32}$/.test(orderId);
}
