import '../support/schemaValidator';

describe('POST /auth', () => {
  const baseUrl = 'https://restful-booker.herokuapp.com';

  it('200 + valid token for correct credentials', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/auth`,
      body: {
        username: Cypress.env('RESTFUL_BOOKER_USER') || 'admin',
        password: Cypress.env('RESTFUL_BOOKER_PASS') || 'password123'
      }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.duration).to.be.lessThan(2000);

      cy.validateSchema('auth-openapi.yaml', '/auth', 'post', '200', res.body);
      expect(res.body.token).to.have.length.at.least(10);
    });
  });

  it('200 + bad credentials for wrong password', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/auth`,
      body: {
        username: 'admin',
        password: 'badpassword'
      },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      cy.validateSchema('auth-openapi.yaml', '/auth', 'post', '200', res.body);
      expect(res.body.reason).to.eq('Bad credentials');
    });
  });

  it('200 + bad credentials for missing credentials', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/auth`,
      body: {},
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
      cy.validateSchema('auth-openapi.yaml', '/auth', 'post', '200', res.body);
      expect(res.body.reason).to.eq('Bad credentials');
    });
  });

});
