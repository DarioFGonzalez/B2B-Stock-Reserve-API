const createError = require('../src/utils/errorBuilder');

test('createError constructs an Error with extra properties', () => {
  const err = createError('boom', 418, 'TEST_CODE', { extra: 'x' });
  expect(err).toBeInstanceOf(Error);
  expect(err.message).toBe('boom');
  expect(err.status).toBe(418);
  expect(err.code).toBe('TEST_CODE');
  expect(err.timestamp).toBeDefined();
  expect(err.extra).toBe('x');
});
