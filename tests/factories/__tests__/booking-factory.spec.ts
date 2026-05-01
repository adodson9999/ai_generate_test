import { test, expect } from '@playwright/test';
import { bookingFactory } from '../booking-factory';
import { getValidator } from '../../helpers/schema-validator';

test.describe('Booking Factory', () => {
  test('build() produces a schema-valid booking', () => {
    const booking = bookingFactory.build();
    const validate = getValidator('booking-lifecycle-openapi.yaml', '/booking/{id}', 'get', '200');
    const { valid, errors } = validate(booking);
    expect(valid, `Schema errors: ${errors.join(', ')}`).toBe(true);
  });

  test('build() with overrides applies them', () => {
    const booking = bookingFactory.build({ totalprice: 42, firstname: 'Override' });
    expect(booking.totalprice).toBe(42);
    expect(booking.firstname).toBe('Override');
  });

  test('seed() produces deterministic output', () => {
    bookingFactory.seed(12345);
    const a = bookingFactory.build();
    bookingFactory.seed(12345);
    const b = bookingFactory.build();
    expect(a).toEqual(b);
  });

  test('seed() with different seeds produces different output', () => {
    bookingFactory.seed(11111);
    const a = bookingFactory.build();
    bookingFactory.seed(99999);
    const b = bookingFactory.build();
    expect(a.firstname).not.toBe(b.firstname);
  });

  test('boundary("totalprice", "min") returns 0', () => {
    const booking = bookingFactory.boundary('totalprice', 'min');
    expect(booking.totalprice).toBe(0);
  });

  test('boundary("totalprice", "max") returns 99999', () => {
    const booking = bookingFactory.boundary('totalprice', 'max');
    expect(booking.totalprice).toBe(99999);
  });

  test('boundary("firstname", "min") returns single char', () => {
    const booking = bookingFactory.boundary('firstname', 'min');
    expect(booking.firstname).toBe('A');
  });

  test('invalid("totalprice", "type") returns string instead of number', () => {
    const booking = bookingFactory.invalid('totalprice', 'type');
    expect(typeof booking.totalprice).toBe('string');
  });

  test('invalid("firstname", "missing") removes the field', () => {
    const booking = bookingFactory.invalid('firstname', 'missing');
    expect(booking).not.toHaveProperty('firstname');
  });

  test('Dates are always YYYY-MM-DD format', () => {
    bookingFactory.seed(42);
    const booking = bookingFactory.build();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(booking.bookingdates.checkin).toMatch(dateRegex);
    expect(booking.bookingdates.checkout).toMatch(dateRegex);
  });
});
