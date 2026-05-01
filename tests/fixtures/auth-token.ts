import { test as base } from '@playwright/test';

type AuthFixtures = {
  authToken: string;
};

export const test = base.extend<AuthFixtures>({
  authToken: async ({ request }, use) => {
    const username = process.env.RESTFUL_BOOKER_USER || 'admin';
    const password = process.env.RESTFUL_BOOKER_PASS || 'password123';
    
    const res = await request.post('https://restful-booker.herokuapp.com/auth', {
      data: { username, password }
    });
    
    const body = await res.json();
    await use(body.token);
  }
});

export { expect } from '@playwright/test';
