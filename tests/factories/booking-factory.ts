import { faker } from '@faker-js/faker';

let seeded = false;

export const bookingFactory = {
  seed(seedValue: number) {
    faker.seed(seedValue);
    seeded = true;
  },

  build(overrides: Record<string, any> = {}): any {
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

  boundary(field: string, edge: 'min' | 'max'): any {
    const overrides: Record<string, any> = {};

    switch (field) {
      case 'firstname':
        overrides.firstname = edge === 'min' ? 'A' : faker.string.alpha(200);
        break;
      case 'lastname':
        overrides.lastname = edge === 'min' ? 'B' : faker.string.alpha(200);
        break;
      case 'totalprice':
        overrides.totalprice = edge === 'min' ? 0 : 99999;
        break;
      case 'depositpaid':
        overrides.depositpaid = edge === 'min' ? false : true;
        break;
      case 'bookingdates':
        if (edge === 'min') {
          overrides.bookingdates = { checkin: '2000-01-01', checkout: '2000-01-02' };
        } else {
          overrides.bookingdates = { checkin: '2099-12-30', checkout: '2099-12-31' };
        }
        break;
      default:
        break;
    }

    return this.build(overrides);
  },

  invalid(field: string, kind: 'type' | 'missing' | 'format' = 'type'): any {
    const booking = this.build();

    if (kind === 'missing') {
      delete booking[field];
      return booking;
    }

    if (kind === 'format' && field.includes('date')) {
      booking.bookingdates = { ...booking.bookingdates, checkin: 'not-a-date' };
      return booking;
    }

    // type violations
    switch (field) {
      case 'firstname':
        booking.firstname = 12345;
        break;
      case 'lastname':
        booking.lastname = true;
        break;
      case 'totalprice':
        booking.totalprice = 'not-a-number';
        break;
      case 'depositpaid':
        booking.depositpaid = 'yes';
        break;
      default:
        break;
    }

    return booking;
  },
};
