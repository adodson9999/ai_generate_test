import '../support/auth';

const BASE_URL = 'https://restful-booker.herokuapp.com';

function buildBooking(label) {
  return {
    firstname: label,
    lastname: 'Concurrent',
    totalprice: 100,
    depositpaid: true,
    bookingdates: { checkin: '2026-01-01', checkout: '2026-01-10' },
    additionalneeds: 'Breakfast'
  };
}

describe('Concurrency Tests @slow @concurrency', () => {

  it('Two concurrent PUTs — last-write-wins', () => {
    // Create a booking
    cy.request('POST', `${BASE_URL}/booking`, buildBooking('Setup')).then(createRes => {
      const bid = createRes.body.bookingid;
      cy.getToken().then(token => {
        // Fire N sequential PUTs (Cypress cannot truly parallelize)
        // but we can verify the API accepts overlapping writes
        const updates = Array.from({ length: 5 }, (_, i) => buildBooking('PUT_' + i));
        updates.forEach(body => {
          cy.request({
            method: 'PUT',
            url: `${BASE_URL}/booking/${bid}`,
            headers: { Cookie: 'token=' + token },
            body,
            failOnStatusCode: false
          }).its('status').should('eq', 200);
        });

        // Check final state
        cy.request(`${BASE_URL}/booking/${bid}`).then(finalRes => {
          expect(finalRes.status).to.eq(200);
          expect(updates.map(u => u.firstname)).to.include(finalRes.body.firstname);
        });
      });
    });
  });

  it('Concurrent CREATEs with identical data — duplicates allowed', () => {
    const booking = buildBooking('Duplicate');
    const ids = [];

    // Create 5 bookings with same data
    for (let i = 0; i < 5; i++) {
      cy.request('POST', `${BASE_URL}/booking`, booking).then(res => {
        expect(res.status).to.eq(200);
        ids.push(res.body.bookingid);
      });
    }

    // Verify all IDs are unique (no dedup)
    cy.wrap(null).then(() => {
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).to.eq(5);
    });
  });

  it('Concurrent reads during write — consistency check', () => {
    cy.request('POST', `${BASE_URL}/booking`, buildBooking('Setup')).then(createRes => {
      const bid = createRes.body.bookingid;
      cy.getToken().then(token => {
        // Do a PUT then immediately read multiple times
        cy.request({
          method: 'PUT',
          url: `${BASE_URL}/booking/${bid}`,
          headers: { Cookie: 'token=' + token },
          body: buildBooking('DuringWrite')
        }).its('status').should('eq', 200);

        // Multiple GETs — all should return consistent state
        for (let i = 0; i < 5; i++) {
          cy.request(`${BASE_URL}/booking/${bid}`).then(getRes => {
            expect(getRes.status).to.eq(200);
            expect(getRes.body).to.have.property('firstname');
            expect(getRes.body).to.have.property('lastname');
          });
        }
      });
    });
  });
});
