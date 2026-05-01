Cypress.Commands.add('getToken', () => {
  const username = Cypress.env('RESTFUL_BOOKER_USER') || 'admin';
  const password = Cypress.env('RESTFUL_BOOKER_PASS') || 'password123';

  return cy.request({
    method: 'POST',
    url: 'https://restful-booker.herokuapp.com/auth',
    body: { username, password },
    log: false
  }).then((res) => {
    return res.body.token;
  });
});
