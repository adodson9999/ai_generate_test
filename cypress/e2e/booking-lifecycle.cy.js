import '../support/auth';
import '../support/schemaValidator';

function buildBooking() {
  return {
    firstname: `Jane_${Math.random().toString(36).substring(7)}`,
    lastname: `Smith_${Math.random().toString(36).substring(7)}`,
    totalprice: Math.floor(Math.random() * 1000),
    depositpaid: false,
    bookingdates: {
      checkin: '2026-02-01',
      checkout: '2026-02-10'
    },
    additionalneeds: 'Lunch'
  };
}

describe('Booking CRUD Lifecycle', () => {
  const baseUrl = 'https://restful-booker.herokuapp.com';
  let bookingId;
  let createdBooking;
  let updatedBooking;
  let hasFailed = false;

  beforeEach(function() {
    if (hasFailed) {
      this.skip();
    }
  });

  afterEach(function() {
    if (this.currentTest.state === 'failed') {
      hasFailed = true;
    }
  });

  it('1. Create a new booking (POST)', () => {
    createdBooking = buildBooking();
    cy.request({
      method: 'POST',
      url: `${baseUrl}/booking`,
      body: createdBooking
    }).then((res) => {
      expect(res.status).to.eq(200);
      cy.validateSchema('booking-lifecycle-openapi.yaml', '/booking', 'post', '200', res.body);

      bookingId = res.body.bookingid;
      expect(res.body.booking).to.deep.eq(createdBooking);
    });
  });

  it('2. Read the booking (GET)', () => {
    expect(bookingId).to.exist;
    cy.request(`${baseUrl}/booking/${bookingId}`).then((res) => {
      expect(res.status).to.eq(200);
      cy.validateSchema('booking-lifecycle-openapi.yaml', '/booking/{id}', 'get', '200', res.body);

      expect(res.body).to.deep.eq(createdBooking);
    });
  });

  it('3. Update the entire booking (PUT)', () => {
    expect(bookingId).to.exist;
    updatedBooking = buildBooking();
    updatedBooking.totalprice = 8888;
    
    cy.getToken().then((token) => {
      cy.request({
        method: 'PUT',
        url: `${baseUrl}/booking/${bookingId}`,
        headers: { Cookie: `token=${token}` },
        body: updatedBooking
      }).then((res) => {
        expect(res.status).to.eq(200);
        cy.validateSchema('booking-lifecycle-openapi.yaml', '/booking/{id}', 'put', '200', res.body);
        expect(res.body).to.deep.eq(updatedBooking);
      });
    });
  });

  it('4. Patch one field of the booking (PATCH)', () => {
    expect(bookingId).to.exist;
    const newFirstname = 'PatchedNameCypress';
    
    cy.getToken().then((token) => {
      cy.request({
        method: 'PATCH',
        url: `${baseUrl}/booking/${bookingId}`,
        headers: { Cookie: `token=${token}` },
        body: { firstname: newFirstname }
      }).then((res) => {
        expect(res.status).to.eq(200);
        cy.validateSchema('booking-lifecycle-openapi.yaml', '/booking/{id}', 'patch', '200', res.body);

        expect(res.body.firstname).to.eq(newFirstname);
        expect(res.body.lastname).to.eq(updatedBooking.lastname);
        expect(res.body.totalprice).to.eq(updatedBooking.totalprice);
        
        updatedBooking.firstname = newFirstname;
      });
    });
  });

  it('5. Delete the booking (DELETE) and verify 404', () => {
    expect(bookingId).to.exist;
    
    cy.getToken().then((token) => {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/booking/${bookingId}`,
        headers: { Cookie: `token=${token}` }
      }).then((res) => {
        expect(res.status).to.eq(201);
      });
      
      cy.request({
        method: 'GET',
        url: `${baseUrl}/booking/${bookingId}`,
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.eq(404);
      });
    });
  });
});
