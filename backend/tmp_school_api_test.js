const fetch = global.fetch;
(async () => {
  try {
    const base = 'http://localhost:3010';
    const timestamp = Date.now();
    const superEmail = `superadmin-test-${timestamp}@zhi.com`;
    const superPassword = 'Admin123!';
    const schoolCode = `abc-matric-${timestamp}`;
    const schoolEmail = `school-${timestamp}@abc.com`;
    const schoolAdminEmail = `schooladmin-${timestamp}@abc.com`;
    const schoolAdminPassword = 'SchoolAdmin123!';
    const registrationKey = 'ZHI_SUPER_ADMIN_2026_SECRET';

    const requestJson = async (url, method, body, headers = {}) => {
      const res = await fetch(url, {
        method,
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: body ? JSON.stringify(body) : undefined
      });
      const text = await res.text();
      let data = text;
      try { data = JSON.parse(text); } catch (e) {}
      return { res, data, headers: res.headers };
    };

    console.log('REGISTER SUPER ADMIN');
    const reg = await requestJson(`${base}/api/auth/register`, 'POST', {
      email: superEmail,
      password: superPassword,
      name: 'Super Admin Test',
      role: 'super_admin',
      registrationKey
    });
    console.log('register status', reg.res.status, reg.data);
    if (reg.res.status !== 201 && reg.res.status !== 400) return;

    console.log('LOGIN SUPER ADMIN');
    const login = await requestJson(`${base}/api/auth/login`, 'POST', {
      email: superEmail,
      password: superPassword
    });
    console.log('login status', login.res.status, login.data);
    if (login.res.status !== 200) return;
    const superCookie = login.headers.get('set-cookie')?.split(';')[0];
    console.log('superCookie', superCookie);
    if (!superCookie) return;

    console.log('CREATE SCHOOL');
    const schoolRes = await requestJson(
      `${base}/api/admin/schools`,
      'POST',
      {
        name: 'ABC Matriculation School',
        code: schoolCode,
        city: 'Chennai',
        state: 'Tamil Nadu',
        address: '123 School Street',
        phone: '9876543210',
        email: schoolEmail,
        principal_name: 'Principal Kumar',
        max_students: 500,
        max_teachers: 50,
        plan_type_id: 3,
        plan_status_id: 1
      },
      { Cookie: superCookie }
    );
    console.log('school create', schoolRes.res.status, schoolRes.data);
    const schoolId = schoolRes.data?.data?.id;
    if (!schoolId) return;

    console.log('CREATE SCHOOL ADMIN');
    const schoolAdminRes = await requestJson(
      `${base}/api/admin/school-admins`,
      'POST',
      {
        email: schoolAdminEmail,
        password: schoolAdminPassword,
        name: 'School Admin Kumar',
        school_id: schoolId,
        phone: '9876543211'
      },
      { Cookie: superCookie }
    );
    console.log('school admin create', schoolAdminRes.res.status, schoolAdminRes.data);
    if (schoolAdminRes.res.status !== 201) return;

    console.log('LOGIN SCHOOL ADMIN');
    const schoolAdminLogin = await requestJson(`${base}/api/auth/login`, 'POST', {
      email: schoolAdminEmail,
      password: schoolAdminPassword
    });
    console.log('school admin login', schoolAdminLogin.res.status, schoolAdminLogin.data);
    if (schoolAdminLogin.res.status !== 200) return;
    const schoolAdminCookie = schoolAdminLogin.headers.get('set-cookie')?.split(';')[0];
    console.log('schoolAdminCookie', schoolAdminCookie);
    if (!schoolAdminCookie) return;

    console.log('GET /api/school-admin/me');
    const meRes = await fetch(`${base}/api/school-admin/me`, { headers: { Cookie: schoolAdminCookie } });
    console.log('me', meRes.status, await meRes.text());

    console.log('GET /api/school-admin/dashboard');
    const dashRes = await fetch(`${base}/api/school-admin/dashboard`, { headers: { Cookie: schoolAdminCookie } });
    console.log('dashboard', dashRes.status, await dashRes.text());

    console.log('CREATE STUDENT');
    const createStudentRes = await requestJson(
      `${base}/api/school-admin/students`,
      'POST',
      {
        full_name: 'Test Student',
        date_of_birth: '2020-01-01',
        grade_id: null,
        roll_number: 'LKG-001',
        section: 'A',
        admission_date: '2026-06-03',
        status_id: 1
      },
      { Cookie: schoolAdminCookie }
    );
    console.log('student create', createStudentRes.res.status, createStudentRes.data);
    const studentRecordId = createStudentRes.data?.data?.id;
    if (!studentRecordId) return;

    console.log('LIST STUDENTS');
    const listStudentsRes = await fetch(`${base}/api/school-admin/students`, { headers: { Cookie: schoolAdminCookie } });
    console.log('list students', listStudentsRes.status, await listStudentsRes.text());

    console.log('GET STUDENT BY ID');
    const getStudentRes = await fetch(`${base}/api/school-admin/students/${studentRecordId}`, { headers: { Cookie: schoolAdminCookie } });
    console.log('get student', getStudentRes.status, await getStudentRes.text());

    console.log('UPDATE STUDENT');
    const updateStudentRes = await requestJson(
      `${base}/api/school-admin/students/${studentRecordId}`,
      'PUT',
      { section: 'B', roll_number: 'LKG-002' },
      { Cookie: schoolAdminCookie }
    );
    console.log('update student', updateStudentRes.res.status, updateStudentRes.data);

    console.log('DELETE STUDENT');
    const deleteStudentRes = await fetch(`${base}/api/school-admin/students/${studentRecordId}`, {
      method: 'DELETE',
      headers: { Cookie: schoolAdminCookie }
    });
    console.log('delete student', deleteStudentRes.status, await deleteStudentRes.text());

    console.log('LIST SCHOOL ADMINs (super admin)');
    const listSchoolAdminsRes = await fetch(`${base}/api/admin/school-admins`, { headers: { Cookie: superCookie } });
    console.log('list school admins', listSchoolAdminsRes.status, await listSchoolAdminsRes.text());

    console.log('LIST SCHOOLS (super admin)');
    const listSchoolsRes = await fetch(`${base}/api/admin/schools`, { headers: { Cookie: superCookie } });
    console.log('list schools', listSchoolsRes.status, await listSchoolsRes.text());

    console.log('TEST COMPLETE');
  } catch (error) {
    console.error('ERROR', error);
    process.exit(1);
  }
})();
