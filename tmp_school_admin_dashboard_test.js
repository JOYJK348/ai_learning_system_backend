const fetch = global.fetch;
(async () => {
  try {
    const base = 'http://localhost:3010';
    const timestamp = Date.now();
    const superEmail = `superadmin-dashboard-test-${timestamp}@zhi.com`;
    const superPassword = 'Admin123!';
    const schoolCode = `abc-matric-dashboard-${timestamp}`;
    const schoolEmail = `school-dashboard-${timestamp}@abc.com`;
    const schoolAdminEmail = `schooladmin-dashboard-${timestamp}@abc.com`;
    const schoolAdminPassword = 'SchoolAdmin123!';
    const registrationKey = 'ZHI_SUPER_ADMIN_2026_SECRET';

    const requestJson = async (url, method, body, headers = {}) => {
      const res = await fetch(url, {
        method,
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json().catch(() => null);
      return { res, data, headers: res.headers };
    };

    const register = await requestJson(`${base}/api/auth/register`, 'POST', {
      email: superEmail,
      password: superPassword,
      name: 'Super Admin Dashboard Test',
      role: 'super_admin',
      registrationKey
    });
    if (![200, 201, 400].includes(register.res.status)) {
      throw new Error(`register failed ${register.res.status}: ${JSON.stringify(register.data)}`);
    }

    const login = await requestJson(`${base}/api/auth/login`, 'POST', {
      email: superEmail,
      password: superPassword
    });
    if (login.res.status !== 200) {
      throw new Error(`super admin login failed ${login.res.status}: ${JSON.stringify(login.data)}`);
    }
    const superCookie = login.headers.get('set-cookie')?.split(';')[0];
    if (!superCookie) throw new Error('missing super admin cookie');

    const createSchool = await requestJson(
      `${base}/api/admin/schools`,
      'POST',
      {
        name: 'Dashboard School Test',
        code: schoolCode,
        city: 'Chennai',
        state: 'Tamil Nadu',
        address: '123 Dashboard Street',
        phone: '9876543210',
        email: schoolEmail,
        principal_name: 'Principal Test',
        max_students: 500,
        max_teachers: 50,
        plan_type_id: 3,
        plan_status_id: 1
      },
      { Cookie: superCookie }
    );
    if (createSchool.res.status !== 201) {
      throw new Error(`create school failed ${createSchool.res.status}: ${JSON.stringify(createSchool.data)}`);
    }
    const schoolId = createSchool.data?.data?.id;
    if (!schoolId) throw new Error('missing school id');

    const createSchoolAdmin = await requestJson(
      `${base}/api/admin/school-admins`,
      'POST',
      {
        email: schoolAdminEmail,
        password: schoolAdminPassword,
        name: 'School Admin Dashboard Test',
        school_id: schoolId,
        phone: '9876543211'
      },
      { Cookie: superCookie }
    );
    if (createSchoolAdmin.res.status !== 201) {
      throw new Error(`create school admin failed ${createSchoolAdmin.res.status}: ${JSON.stringify(createSchoolAdmin.data)}`);
    }

    const schoolAdminLogin = await requestJson(`${base}/api/auth/login`, 'POST', {
      email: schoolAdminEmail,
      password: schoolAdminPassword
    });
    if (schoolAdminLogin.res.status !== 200) {
      throw new Error(`school admin login failed ${schoolAdminLogin.res.status}: ${JSON.stringify(schoolAdminLogin.data)}`);
    }
    const schoolAdminCookie = schoolAdminLogin.headers.get('set-cookie')?.split(';')[0];
    if (!schoolAdminCookie) throw new Error('missing school admin cookie');

    const dashboardRes = await fetch(`${base}/api/school-admin/dashboard`, {
      headers: { Cookie: schoolAdminCookie }
    });

    const dashboardData = await dashboardRes.json().catch(() => null);
    if (dashboardRes.status !== 200) {
      throw new Error(`dashboard failed ${dashboardRes.status}: ${JSON.stringify(dashboardData)}`);
    }

    if (!dashboardData?.my_school) {
      throw new Error(`dashboard response missing my_school: ${JSON.stringify(dashboardData)}`);
    }
    if (!dashboardData?.students_by_grade || !dashboardData?.students_by_section) {
      throw new Error(`dashboard response missing aggregation fields: ${JSON.stringify(dashboardData)}`);
    }

    console.log('DASHBOARD TEST PASS');
    console.log(JSON.stringify(dashboardData, null, 2));
  } catch (error) {
    console.error('ERROR', error);
    process.exit(1);
  }
})();
