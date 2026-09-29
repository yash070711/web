import { api } from './api.js';

const users = api('users');

document.addEventListener('DOMContentLoaded', async () => {
  console.log('App loaded, users:', await users.list());
});
