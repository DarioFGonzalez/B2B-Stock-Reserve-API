const { generateInvoiceNumber } = require('../src/utils/invoiceUtils');

test('generateInvoiceNumber has expected format', () => {
  const num = generateInvoiceNumber();
  expect(num).toMatch(/^INV-\d{8}-\d{4}$/);
  const parts = num.split('-');
  expect(parts.length).toBe(3);
  expect(parts[1].length).toBe(8);
});
