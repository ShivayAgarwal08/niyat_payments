import { describe, it, expect } from 'vitest';
import { LocalDeterministicParser } from '../ai/localParser.js';

describe('Local Deterministic Parser', () => {
  const parser = new LocalDeterministicParser();

  it('correctly parses milk shopping request with budget and quantity', () => {
    const res = parser.parse('Buy 2 litres of Amul Taaza milk under ₹150.');
    expect(res.productCategory).toBe('Milk');
    expect(res.preferredBrand).toBe('Amul');
    expect(res.variantOrModel).toBe('Taaza Toned');
    expect(res.quantity).toBe(2);
    expect(res.unit).toBe('Litre');
    expect(res.maxBudgetPaise).toBe(15000); // ₹150 = 15000 paise
  });

  it('correctly parses Mother Dairy toned milk with below ₹70 budget', () => {
    const res = parser.parse('Get 1 litre of Mother Dairy toned milk below ₹70.');
    expect(res.productCategory).toBe('Milk');
    expect(res.preferredBrand).toBe('Mother Dairy');
    expect(res.quantity).toBe(1);
    expect(res.unit).toBe('Litre');
    expect(res.maxBudgetPaise).toBe(7000); // ₹70 = 7000 paise
  });

  it('correctly parses Laptop shopping request', () => {
    const res = parser.parse('Buy 1 Apple MacBook Air M2 under ₹85,000.');
    expect(res.productCategory).toBe('Laptop');
    expect(res.preferredBrand).toBe('Apple');
    expect(res.variantOrModel).toContain('MacBook Air M2');
    expect(res.quantity).toBe(1);
    expect(res.unit).toBe('Unit');
    expect(res.maxBudgetPaise).toBe(8500000); // ₹85,000
  });

  it('correctly parses Smartphone shopping request', () => {
    const res = parser.parse('Order 1 iPhone 15 below ₹70000');
    expect(res.productCategory).toBe('Smartphone');
    expect(res.preferredBrand).toBe('Apple');
    expect(res.quantity).toBe(1);
    expect(res.maxBudgetPaise).toBe(7000000);
  });

  it('correctly parses Running Shoes shopping request', () => {
    const res = parser.parse('Buy 1 pair of Nike shoes under ₹4000');
    expect(res.productCategory).toBe('Shoes');
    expect(res.preferredBrand).toBe('Nike');
    expect(res.unit).toBe('Pair');
    expect(res.maxBudgetPaise).toBe(400000);
  });

  it('flags ambiguous input and asks for clarification', () => {
    const res = parser.parse('stuff hello');
    expect(res.productCategory).toBe('Unknown');
    expect(res.confidence).toBeLessThan(0.5);
    expect(res.ambiguityQuestion).toBeDefined();
    expect(res.ambiguityQuestion).toContain('Could you clarify');
  });
});
