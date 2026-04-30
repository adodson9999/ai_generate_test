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
      expect(b.firstname).to.be.a('string');
      expect(b.lastname).to.be.a('string');
      expect(b.totalprice).to.be.a('number').and.to.be.at.least(0);
      expect(b.depositpaid).to.be.a('boolean');
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
