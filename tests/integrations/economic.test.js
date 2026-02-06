/**
 * e-conomic Connector Tests
 * @module tests/integrations/economic.test
 *
 * Run with: node tests/integrations/economic.test.js
 */

import { EconomicConnector } from '../../js/integrations/connectors/economic/index.js';
import {
  createCustomer,
  createInvoice,
  createInvoiceLine,
  createPayment,
  isValidCvr,
  isValidDanishVat,
  validateInvoice
} from '../../js/integrations/core/canonical-model.js';
import {
  mapCanonicalCustomerToEconomic,
  mapEconomicCustomerToCanonical,
  mapCanonicalInvoiceToEconomic
} from '../../js/integrations/connectors/economic/mappers.js';

// ============ TEST UTILITIES ============

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.log(`  ✗ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  if (passed) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.log(`  ✗ ${message}`);
    console.log(`    Expected: ${JSON.stringify(expected)}`);
    console.log(`    Actual: ${JSON.stringify(actual)}`);
  }
}

function testGroup(name, fn) {
  console.log(`\n${name}`);
  console.log('─'.repeat(50));
  fn();
}

// ============ VALIDATION TESTS ============

testGroup('Validation Functions', () => {
  // CVR validation
  assert(isValidCvr('12345678'), 'Valid 8-digit CVR');
  assert(isValidCvr('1234-5678'), 'CVR with dash is normalized');
  assert(!isValidCvr('1234567'), 'CVR with 7 digits is invalid');
  assert(!isValidCvr('123456789'), 'CVR with 9 digits is invalid');
  assert(!isValidCvr(null), 'Null CVR is invalid');
  assert(!isValidCvr(''), 'Empty CVR is invalid');

  // VAT number validation
  assert(isValidDanishVat('DK12345678'), 'Valid Danish VAT number');
  assert(isValidDanishVat('DK 1234 5678'), 'VAT with spaces is normalized');
  assert(!isValidDanishVat('SE12345678'), 'Swedish VAT is invalid for Danish validation');
  assert(!isValidDanishVat('12345678'), 'VAT without country code is invalid');
});

// ============ CANONICAL MODEL TESTS ============

testGroup('Canonical Model - Customer', () => {
  const customer = createCustomer({
    name: 'Test Restaurant',
    cvr: '12345678',
    email: 'test@restaurant.dk',
    address: {
      street: 'Testvej 1',
      city: 'København',
      postalCode: '1000',
      country: 'DK'
    }
  });

  assert(customer.id !== null, 'Customer has generated ID');
  assertEqual(customer.name, 'Test Restaurant', 'Customer name is set');
  assertEqual(customer.cvr, '12345678', 'Customer CVR is set');
  assertEqual(customer.type, 'customer', 'Type defaults to customer');
  assertEqual(customer.currency, 'DKK', 'Currency defaults to DKK');
  assertEqual(customer.paymentTermsDays, 14, 'Payment terms defaults to 14 days');
  assertEqual(customer.isActive, true, 'Customer is active by default');
  assertEqual(customer.address.country, 'DK', 'Country defaults to DK');
});

testGroup('Canonical Model - Invoice', () => {
  const invoice = createInvoice({
    customerName: 'Test Kunde',
    lines: [
      { description: 'Produkt 1', quantity: 2, unitPrice: 100 },
      { description: 'Produkt 2', quantity: 1, unitPrice: 200, discountPercent: 10 }
    ]
  });

  assert(invoice.id !== null, 'Invoice has generated ID');
  assertEqual(invoice.lines.length, 2, 'Invoice has 2 lines');
  assertEqual(invoice.lines[0].lineNumber, 1, 'First line number is 1');
  assertEqual(invoice.lines[1].lineNumber, 2, 'Second line number is 2');
  assertEqual(invoice.lines[0].lineTotal, 200, 'First line total: 2 * 100 = 200');
  assertEqual(invoice.lines[1].lineTotal, 180, 'Second line total: 1 * 200 * 0.9 = 180');
  assertEqual(invoice.subtotal, 380, 'Subtotal is sum of line totals');
  assert(invoice.vatAmount > 0, 'VAT amount is calculated');
  assertEqual(invoice.status, 'draft', 'Status defaults to draft');
});

testGroup('Invoice Validation', () => {
  const validInvoice = createInvoice({
    customerId: 'cust-123',
    lines: [{ description: 'Test', quantity: 1, unitPrice: 100 }]
  });

  const result1 = validateInvoice(validInvoice);
  assert(result1.valid, 'Valid invoice passes validation');

  const noCustomerInvoice = createInvoice({
    lines: [{ description: 'Test', quantity: 1, unitPrice: 100 }]
  });
  noCustomerInvoice.customerName = '';
  noCustomerInvoice.customerId = null;

  const result2 = validateInvoice(noCustomerInvoice);
  assert(!result2.valid, 'Invoice without customer fails validation');

  const noLinesInvoice = createInvoice({
    customerId: 'cust-123',
    lines: []
  });

  const result3 = validateInvoice(noLinesInvoice);
  assert(!result3.valid, 'Invoice without lines fails validation');
});

// ============ MAPPER TESTS ============

testGroup('e-conomic Mappers - Customer', () => {
  // Canonical to e-conomic
  const canonical = createCustomer({
    name: 'Restaurant Test',
    cvr: '12345678',
    vatNumber: 'DK12345678',
    email: 'info@test.dk',
    phone: '+45 12345678',
    address: {
      street: 'Testgade 123',
      city: 'København',
      postalCode: '1000',
      country: 'DK'
    },
    paymentTermsDays: 30
  });

  const economic = mapCanonicalCustomerToEconomic(canonical);

  assertEqual(economic.name, 'Restaurant Test', 'Name is mapped');
  assertEqual(economic.corporateIdentificationNumber, '12345678', 'CVR is mapped');
  assertEqual(economic.vatNumber, 'DK12345678', 'VAT number is mapped');
  assertEqual(economic.email, 'info@test.dk', 'Email is mapped');
  assertEqual(economic.address, 'Testgade 123', 'Street is mapped');
  assertEqual(economic.city, 'København', 'City is mapped');
  assertEqual(economic.zip, '1000', 'Postal code is mapped');
  assert(economic.paymentTerms !== null, 'Payment terms reference is set');
  assert(economic.customerGroup !== null, 'Customer group reference is set');
  assert(economic.vatZone !== null, 'VAT zone reference is set');

  // e-conomic to Canonical
  const economicCustomer = {
    customerNumber: 12345,
    name: 'Test Restaurant ApS',
    corporateIdentificationNumber: '87654321',
    vatNumber: 'DK87654321',
    email: 'contact@test.dk',
    telephoneAndFaxNumber: '12345678',
    address: 'Hovedgaden 1',
    city: 'Aarhus',
    zip: '8000',
    country: 'DK',
    currency: 'DKK',
    paymentTerms: { daysOfCredit: 14 },
    barred: false
  };

  const mappedCanonical = mapEconomicCustomerToCanonical(economicCustomer);

  assertEqual(mappedCanonical.externalIds.economic, '12345', 'External ID is mapped');
  assertEqual(mappedCanonical.customerNumber, '12345', 'Customer number is mapped');
  assertEqual(mappedCanonical.name, 'Test Restaurant ApS', 'Name is mapped back');
  assertEqual(mappedCanonical.cvr, '87654321', 'CVR is mapped back');
  assertEqual(mappedCanonical.address.street, 'Hovedgaden 1', 'Address is mapped back');
  assertEqual(mappedCanonical.isActive, true, 'Not barred = active');
});

testGroup('e-conomic Mappers - Invoice', () => {
  const canonical = createInvoice({
    customerName: 'Test Kunde',
    invoiceDate: '2026-02-05',
    paymentTermsDays: 14,
    reference: 'Ordre #12345',
    notes: 'Tak for handlen',
    lines: [
      { description: 'Burger', quantity: 2, unitPrice: 89 },
      { description: 'Øl', quantity: 2, unitPrice: 45, discountPercent: 10 }
    ]
  });

  const economic = mapCanonicalInvoiceToEconomic(canonical, { customerNumber: 12345 });

  assertEqual(economic.customer.customerNumber, 12345, 'Customer number is set');
  assertEqual(economic.date, '2026-02-05', 'Invoice date is mapped');
  assertEqual(economic.lines.length, 2, 'Lines are mapped');
  assertEqual(economic.lines[0].description, 'Burger', 'Line description is mapped');
  assertEqual(economic.lines[0].quantity, 2, 'Line quantity is mapped');
  assertEqual(economic.lines[0].unitNetPrice, 89, 'Line unit price is mapped');
  assertEqual(economic.lines[1].discountPercentage, 10, 'Line discount is mapped');
  assertEqual(economic.references.other, 'Ordre #12345', 'Reference is mapped');
  assertEqual(economic.notes.heading, 'Tak for handlen', 'Notes are mapped');
});

// ============ CONNECTOR TESTS ============

testGroup('EconomicConnector - Configuration', () => {
  // Should throw without required config
  let threwError = false;
  try {
    new EconomicConnector({});
  } catch (e) {
    threwError = true;
    assert(e.message.includes('appSecretToken'), 'Error mentions missing appSecretToken');
  }
  assert(threwError, 'Throws without appSecretToken');

  threwError = false;
  try {
    new EconomicConnector({ appSecretToken: 'test' });
  } catch (e) {
    threwError = true;
    assert(e.message.includes('agreementGrantToken'), 'Error mentions missing agreementGrantToken');
  }
  assert(threwError, 'Throws without agreementGrantToken');

  // Should create with valid config
  const connector = new EconomicConnector({
    appSecretToken: 'test-app-secret',
    agreementGrantToken: 'test-agreement-grant'
  });

  assertEqual(connector.getName(), 'economic', 'Connector name is correct');
  assertEqual(connector.getVersion(), '1.0.0', 'Connector version is correct');
  assertEqual(connector.isConnected(), false, 'Not connected initially');
});

// ============ SUMMARY ============

console.log('\n' + '═'.repeat(50));
console.log(`TEST SUMMARY: ${passedTests} passed, ${failedTests} failed`);
console.log('═'.repeat(50));

if (failedTests > 0) {
  process.exit(1);
}
