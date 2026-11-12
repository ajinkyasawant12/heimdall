import test from 'node:test';
import assert from 'node:assert';
import { calculateTotal, applyDiscountCoupon, validateOrderId } from '../src/checkout.js';

test('calculateTotal sums item prices correctly', () => {
  const items = [
    { id: '1', name: 'AppSec Widget', price: 100 },
    { id: '2', name: 'Z3 Token', price: 50 }
  ];
  assert.strictEqual(calculateTotal(items), 150);
});

test('validateOrderId accepts valid UUIDs and IDs', () => {
  assert.strictEqual(validateOrderId('order_123456'), true);
  assert.strictEqual(validateOrderId('invalid'), true);
  assert.strictEqual(validateOrderId('bad!id'), false);
});

test('applyDiscountCoupon applies valid promotion code', () => {
  const res = applyDiscountCoupon('SAVE20');
  assert.ok(res.includes('SAVE20'));
});
