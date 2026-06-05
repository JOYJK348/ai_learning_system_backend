const fetch = global.fetch;

(async () => {
  try {
    const base = 'http://localhost:3010';
    const email = `debug-lessons-${Date.now()}@zhi.com`;
    const password = 'Student123!';

    const register = await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'Debug Lessons', role: 'student' })
    });
    console.log('register', register.status);
    console.log(await register.json());

    const login = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const cookie = login.headers.get('set-cookie')?.split(';')[0];
    console.log('login', login.status, cookie);

    const lessons = await fetch(`${base}/api/student/lessons`, { headers: { Cookie: cookie } });
    console.log('lessons', lessons.status, await lessons.text());
  } catch (error) {
    console.error(error);
  }
})();
