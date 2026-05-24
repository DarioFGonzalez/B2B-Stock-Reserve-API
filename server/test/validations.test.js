const v = require('../src/utils/validations');

describe('validations util', () => {
  test('isValidUUID returns true for valid uuid', () => {
    expect(v.isValidUUID('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')).toBe(true);
  });

  test('isValidEmail validates emails correctly', () => {
    expect(v.isValidEmail('test@example.com')).toBe(true);
    expect(v.isValidEmail('bad-email')).toBe(false);
  });

  test('validateEmail throws on invalid input', () => {
    expect(() => v.validateEmail('bad-email')).toThrow();
  });

  test('validatePassword enforces rules', () => {
    expect(() => v.validatePassword('short')).toThrow();
    expect(v.isValidPassword('password123')).toBe(true);
  });

  test('validatePaymentTerms accepts allowed values', () => {
    expect(v.validatePaymentTerms('30')).toBe(true);
    expect(() => v.validatePaymentTerms('45')).toThrow();
  });
});
