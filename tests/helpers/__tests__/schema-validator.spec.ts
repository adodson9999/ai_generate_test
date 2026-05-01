import { test, expect } from '@playwright/test';
import { getValidator } from '../schema-validator';

test.describe('Schema Validator Helper', () => {

  test('Valid body passes validation', () => {
    const validate = getValidator('booking-openapi.yaml', '/booking/{id}', 'get', '200');
    const validBody = {
      firstname: "Jim",
      lastname: "Brown",
      totalprice: 111,
      depositpaid: true,
      bookingdates: {
        checkin: "2018-01-01",
        checkout: "2019-01-01"
      },
      additionalneeds: "Breakfast"
    };

    const { valid, errors } = validate(validBody);
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  test('Missing required field fails validation', () => {
    const validate = getValidator('booking-openapi.yaml', '/booking/{id}', 'get', '200');
    const invalidBody = {
      firstname: "Jim",
      // lastname is missing
      totalprice: 111,
      depositpaid: true,
      bookingdates: {
        checkin: "2018-01-01",
        checkout: "2019-01-01"
      }
    };

    const { valid, errors } = validate(invalidBody);
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("must have required property 'lastname'");
  });

  test('Wrong type fails validation', () => {
    const validate = getValidator('booking-openapi.yaml', '/booking/{id}', 'get', '200');
    const invalidBody = {
      firstname: "Jim",
      lastname: "Brown",
      totalprice: "111", // Should be number
      depositpaid: true,
      bookingdates: {
        checkin: "2018-01-01",
        checkout: "2019-01-01"
      }
    };

    const { valid, errors } = validate(invalidBody);
    expect(valid).toBe(false);
    expect(errors[0]).toContain("must be number");
  });

  test('Format violation fails validation', () => {
    const validate = getValidator('booking-openapi.yaml', '/booking/{id}', 'get', '200');
    const invalidBody = {
      firstname: "Jim",
      lastname: "Brown",
      totalprice: 111,
      depositpaid: true,
      bookingdates: {
        checkin: "not-a-date", // Invalid format
        checkout: "2019-01-01"
      }
    };

    const { valid, errors } = validate(invalidBody);
    expect(valid).toBe(false);
    expect(errors[0]).toContain("must match format");
  });

});
