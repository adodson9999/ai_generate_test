const { faker } = require('@faker-js/faker');

const bookingFactory = {
  seed(seedValue) {
    faker.seed(seedValue);
  },

  build(overrides = {}) {
    const checkin = faker.date.future({ years: 1 });
    const checkout = new Date(checkin.getTime() + faker.number.int({ min: 1, max: 14 }) * 86400000);

    const base = {
      firstname: faker.person.firstName(),
      lastname: faker.person.lastName(),
      totalprice: faker.number.int({ min: 0, max: 5000 }),
      depositpaid: faker.datatype.boolean(),
      bookingdates: {
        checkin: checkin.toISOString().split('T')[0],
        checkout: checkout.toISOString().split('T')[0],
      },
      additionalneeds: faker.helpers.arrayElement(['Breakfast', 'Lunch', 'Dinner', 'None', 'Parking']),
    };

    return { ...base, ...overrides };
  },

  boundary(field, edge) {
    const overrides = {};
    switch (field) {
      case 'firstname': overrides.firstname = edge === 'min' ? 'A' : faker.string.alpha(200); break;
      case 'lastname': overrides.lastname = edge === 'min' ? 'B' : faker.string.alpha(200); break;
      case 'totalprice': overrides.totalprice = edge === 'min' ? 0 : 99999; break;
      case 'depositpaid': overrides.depositpaid = edge === 'min' ? false : true; break;
      case 'bookingdates':
        overrides.bookingdates = edge === 'min'
          ? { checkin: '2000-01-01', checkout: '2000-01-02' }
          : { checkin: '2099-12-30', checkout: '2099-12-31' };
        break;
    }
    return this.build(overrides);
  },

  invalid(field, kind = 'type') {
    const booking = this.build();
    if (kind === 'missing') { delete booking[field]; return booking; }
    if (kind === 'format' && field.includes('date')) { booking.bookingdates.checkin = 'not-a-date'; return booking; }
    switch (field) {
      case 'firstname': booking.firstname = 12345; break;
      case 'lastname': booking.lastname = true; break;
      case 'totalprice': booking.totalprice = 'not-a-number'; break;
      case 'depositpaid': booking.depositpaid = 'yes'; break;
    }
    return booking;
  }
};

// Register as a Cypress custom command
Cypress.Commands.add('factory', (type, method = 'build', ...args) => {
  if (type === 'booking') {
    return cy.wrap(bookingFactory[method](...args));
  }
  throw new Error(`Unknown factory type: ${type}`);
});

module.exports = { bookingFactory };
