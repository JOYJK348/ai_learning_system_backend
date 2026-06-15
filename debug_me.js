const fetch = global.fetch;

(async () => {
  try {
    const base = 'http://localhost:3010';
    const timestamp = Date.now();
    const studentEmail = `debug-student-${timestamp}@zhi.com`;
    const studentPassword = 'Student123!';

    const requestJson = async (url, method, body, headers = {}) => {
      const res = await fetch(url, {
        method,
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: body ? JSON.stringify(body) : undefined
      });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      return { res, data, status: res.status, headers: res.headers };
    };

    console.log('Registering...');
    const registerRes = await requestJson(`${base}/api/auth/register`, 'POST', {
      email: studentEmail,
      password: studentPassword,
      name: 'Debug Student',
      role: 'student'
    });
    console.log('register:', registerRes.status, registerRes.data);

    console.log('Logging in...');
    const loginRes = await requestJson(`${base}/api/auth/login`, 'POST', {
      email: studentEmail,
      password: studentPassword
    });
    console.log('login:', loginRes.status);
    const studentCookie = loginRes.headers.get('set-cookie')?.split(';')[0];
    console.log('cookie:', studentCookie);

    console.log('Fetching /api/student/me');
    const meRes = await fetch(`${base}/api/student/me`, { headers: { Cookie: studentCookie } });
    const text = await meRes.text();
    console.log('/api/student/me status:', meRes.status);
    console.log('body:', text);
  } catch (err) {
    console.error('ERR', err);
  }
})();
