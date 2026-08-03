import { formatCurrency } from '@/commerce/currency';

it('formats the relay currency instead of assuming euros', () => {
  expect(formatCurrency(24, 'EUR')).toBe('€24.00');
  expect(formatCurrency(24, 'USD')).toBe('$24.00');
  expect(formatCurrency(24, 'not-a-code')).toBe('NOT-A-CODE 24.00');
});
