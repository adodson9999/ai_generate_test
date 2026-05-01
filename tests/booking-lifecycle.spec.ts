import { test, expect } from './fixtures/auth-token';
import { getValidator } from './helpers/schema-validator';

const BASE_URL = 'https://restful-booker.herokuapp.com';

function buildBooking() {
  return {
    firstname: `John_${Math.random().toString(36).substring(7)}`,
    lastname: `Doe_${Math.random().toString(36).substring(7)}`,
    totalprice: Math.floor(Math.random() * 1000),
    depositpaid: true,
    bookingdates: {
      checkin: '2026-01-01',
      checkout: '2026-01-10'
    },
    additionalneeds: 'Breakfast'
  };
}

test.describe('Booking CRUD Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  let bookingId: number;
  let createdBooking: any;
  let updatedBooking: any;

  const validateCreate = getValidator('booking-lifecycle-openapi.yaml', '/booking', 'post', '200');
  const validateRead = getValidator('booking-lifecycle-openapi.yaml', '/booking/{id}', 'get', '200');
  const validateUpdate = getValidator('booking-lifecycle-openapi.yaml', '/booking/{id}', 'put', '200');
  const validatePatch = getValidator('booking-lifecycle-openapi.yaml', '/booking/{id}', 'patch', '200');

  test('1. Create a new booking (POST)', async ({ request }) => {
    createdBooking = buildBooking();
    const res = await request.post(`${BASE_URL}/booking`, {
      data: createdBooking
    });
    
    expect(res.status()).toBe(200);
    const body = await res.json();
    
    const { valid, errors } = validateCreate(body);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);

    bookingId = body.bookingid;
    expect(body.booking).toEqual(createdBooking);
  });

  test('2. Read the booking (GET)', async ({ request }) => {
    expect(bookingId).toBeDefined();
    
    const res = await request.get(`${BASE_URL}/booking/${bookingId}`);
    expect(res.status()).toBe(200);
    
    const body = await res.json();
    const { valid, errors } = validateRead(body);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);

    expect(body).toEqual(createdBooking);
  });

  test('3. Update the entire booking (PUT)', async ({ request, authToken }) => {
    expect(bookingId).toBeDefined();
    
    updatedBooking = buildBooking();
    updatedBooking.totalprice = 9999;
    
    const res = await request.put(`${BASE_URL}/booking/${bookingId}`, {
      headers: { Cookie: `token=${authToken}` },
      data: updatedBooking
    });
    
    expect(res.status()).toBe(200);
    const body = await res.json();
    const { valid, errors } = validateUpdate(body);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);

    expect(body).toEqual(updatedBooking);
  });

  test('4. Patch one field of the booking (PATCH)', async ({ request, authToken }) => {
    expect(bookingId).toBeDefined();
    
    const newFirstname = 'PatchedName';
    const res = await request.patch(`${BASE_URL}/booking/${bookingId}`, {
      headers: { Cookie: `token=${authToken}` },
      data: { firstname: newFirstname }
    });
    
    expect(res.status()).toBe(200);
    const body = await res.json();
    
    const { valid, errors } = validatePatch(body);
    expect(valid, `Schema validation failed: ${errors.join(', ')}`).toBe(true);

    expect(body.firstname).toBe(newFirstname);
    expect(body.lastname).toBe(updatedBooking.lastname);
    
    updatedBooking.firstname = newFirstname;
  });

  test('5. Delete the booking (DELETE) and verify 404', async ({ request, authToken }) => {
    expect(bookingId).toBeDefined();
    
    const deleteRes = await request.delete(`${BASE_URL}/booking/${bookingId}`, {
      headers: { Cookie: `token=${authToken}` }
    });
    expect(deleteRes.status()).toBe(201);
    
    const getRes = await request.get(`${BASE_URL}/booking/${bookingId}`);
    expect(getRes.status()).toBe(404);
  });
});
