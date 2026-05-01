import '../support/auth';
import cases from '../../tests/helpers/negative-cases.json';

describe('Negative Path Matrix', () => {
  const baseUrl = 'https://restful-booker.herokuapp.com';
  let bookingId;

  // Create a booking to use for tests that target /booking/{id}
  before(() => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/booking`,
      body: {
        firstname: "NegTest",
        lastname: "Fixture",
        totalprice: 100,
        depositpaid: true,
        bookingdates: { checkin: "2026-06-01", checkout: "2026-06-10" },
        additionalneeds: "None"
      }
    }).then((res) => {
      bookingId = res.body.bookingid;
    });
  });

  cases.forEach(c => {
    it(c.name, () => {
      const resolvedPath = c.path.replace('{id}', String(bookingId));

      if (c.needsAuth) {
        cy.getToken().then((token) => {
          const headers = { ...(c.headers || {}), Cookie: `token=${token}` };
          cy.request({
            method: c.method.toUpperCase(),
            url: `${baseUrl}${resolvedPath}`,
            body: c.body,
            headers,
            failOnStatusCode: false
          }).then((res) => {
            expect(res.status).to.eq(c.expectedStatus);
          });
        });
      } else {
        cy.request({
          method: c.method.toUpperCase(),
          url: `${baseUrl}${resolvedPath}`,
          body: c.body,
          headers: c.headers,
          failOnStatusCode: false
        }).then((res) => {
          expect(res.status).to.eq(c.expectedStatus);
        });
      }
    });
  });
});
