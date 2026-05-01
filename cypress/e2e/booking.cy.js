import '../support/auth';
import '../support/schemaValidator';

describe('GET /booking/{id}', () => {
  const baseUrl = 'https://restful-booker.herokuapp.com';
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  let validBookingId;

  before(() => {
    cy.request(`${baseUrl}/booking`).then(({ body }) => {
      validBookingId = body[0].bookingid;
    });
  });

  it('200 + schema-valid booking for a known ID', () => {
    cy.request(`${baseUrl}/booking/${validBookingId}`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.duration).to.be.lessThan(2000);

      const b = res.body;
      cy.validateSchema('booking-openapi.yaml', '/booking/{id}', 'get', '200', b);

      expect(b.totalprice).to.be.at.least(0);
      expect(b.bookingdates.checkin).to.match(isoDate);
      expect(b.bookingdates.checkout).to.match(isoDate);
      expect(new Date(b.bookingdates.checkout).getTime())
        .to.be.at.least(new Date(b.bookingdates.checkin).getTime());
    });
  });

  it('404 for a non-existent ID', () => {
    cy.request({
      url: `${baseUrl}/booking/99999999`,
      failOnStatusCode: false,
    }).its('status').should('eq', 404);
  });
});

describe('Protected endpoints', () => {
  const baseUrl = 'https://restful-booker.herokuapp.com';
  let validBookingId;
  const updatePayload = {
    firstname: "James",
    lastname: "Brown",
    totalprice: 111,
    depositpaid: true,
    bookingdates: {
      checkin: "2026-01-01",
      checkout: "2026-01-02"
    },
    additionalneeds: "Breakfast"
  };

  before(() => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/booking`,
      body: updatePayload
    }).then((res) => {
      validBookingId = res.body.bookingid;
    });
  });

  it('PUT 403 without token, 200 with token', () => {
    cy.request({
      method: 'PUT',
      url: `${baseUrl}/booking/${validBookingId}`,
      body: updatePayload,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(403);
    });

    cy.getToken().then((token) => {
      cy.request({
        method: 'PUT',
        url: `${baseUrl}/booking/${validBookingId}`,
        headers: { Cookie: `token=${token}` },
        body: updatePayload
      }).then((res) => {
        expect(res.status).to.eq(200);
        // Add schema check for completeness if specs existed, but booking-openapi doesn't have PUT. We skip it or use lifecycle spec.
      });
    });
  });

  it('PATCH 403 without token, 200 with token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/booking/${validBookingId}`,
      body: { firstname: "Jane" },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(403);
    });

    cy.getToken().then((token) => {
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/booking/${validBookingId}`,
        headers: { Cookie: `token=${token}` },
        body: { firstname: "Jane" }
      }).then((res) => {
        expect(res.status).to.eq(200);
      });
    });
  });

  it('DELETE 403 without token, 201 with token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/booking/${validBookingId}`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(403);
    });

    cy.getToken().then((token) => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/booking/${validBookingId}`,
        headers: { Cookie: `token=${token}` }
      }).then((res) => {
        expect(res.status).to.eq(201);
      });
    });
  });
});
