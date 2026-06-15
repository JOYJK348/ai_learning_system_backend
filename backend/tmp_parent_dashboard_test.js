const fetch = global.fetch;
(async () => {
  try {
    const base = 'http://localhost:3010';
    const timestamp = Date.now();
    const parentEmail = `parent-dashboard-test-${timestamp}@zhi.com`;
    const parentPassword = 'Parent123!';

    const requestJson = async (url, method, body, headers = {}) => {
      const res = await fetch(url, {
        method,
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json().catch(() => null);
      return { res, data, headers: res.headers };
    };

    console.log('REGISTER PARENT');
    const registerRes = await requestJson(`${base}/api/auth/register`, 'POST', {
      email: parentEmail,
      password: parentPassword,
      name: 'Parent Dashboard Test',
      role: 'parent'
    });
    if (![200, 201, 400].includes(registerRes.res.status)) {
      throw new Error(`register failed ${registerRes.res.status}: ${JSON.stringify(registerRes.data)}`);
    }

    console.log('LOGIN PARENT');
    const loginRes = await requestJson(`${base}/api/auth/login`, 'POST', {
      email: parentEmail,
      password: parentPassword
    });
    if (loginRes.res.status !== 200) {
      throw new Error(`parent login failed ${loginRes.res.status}: ${JSON.stringify(loginRes.data)}`);
    }
    const parentCookie = loginRes.headers.get('set-cookie')?.split(';')[0];
    if (!parentCookie) throw new Error('missing parent cookie');

    console.log('GET /api/parent/me');
    const meRes = await fetch(`${base}/api/parent/me`, { headers: { Cookie: parentCookie } });
    const meData = await meRes.json();
    console.log('me status', meRes.status);
    if (meRes.status !== 200) throw new Error(`me failed: ${JSON.stringify(meData)}`);

    console.log('GET /api/parent/dashboard');
    const dashboardRes = await fetch(`${base}/api/parent/dashboard`, { headers: { Cookie: parentCookie } });
    const dashboardData = await dashboardRes.json();

    if (dashboardRes.status !== 200) {
      throw new Error(`dashboard failed ${dashboardRes.status}: ${JSON.stringify(dashboardData)}`);
    }

    if (!dashboardData?.parent) {
      throw new Error(`dashboard missing parent: ${JSON.stringify(dashboardData)}`);
    }
    if (!dashboardData?.children || !Array.isArray(dashboardData.children)) {
      throw new Error(`dashboard missing children array: ${JSON.stringify(dashboardData)}`);
    }
    if (!dashboardData?.quick_stats) {
      throw new Error(`dashboard missing quick_stats: ${JSON.stringify(dashboardData)}`);
    }

    console.log('PARENT DASHBOARD TEST PASS');
    console.log(JSON.stringify(dashboardData, null, 2));
  } catch (error) {
    console.error('ERROR', error);
    process.exit(1);
  }
})();
