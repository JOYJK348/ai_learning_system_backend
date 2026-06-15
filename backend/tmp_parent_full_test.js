const fetch = global.fetch;

(async () => {
  try {
    const base = 'http://localhost:3010';
    const timestamp = Date.now();
    const parentEmail = `parent-full-test-${timestamp}@zhi.com`;
    const parentPassword = 'Parent123!';
    const studentEmail = `student-full-test-${timestamp}@zhi.com`;
    const studentPassword = 'Student123!';

    const requestJson = async (url, method, body, headers = {}) => {
      const res = await fetch(url, {
        method,
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json().catch(() => null);
      return { res, data, status: res.status, headers: res.headers };
    };

    console.log('\n========== PARENT FULL API TEST ==========\n');

    // 1. Register parent
    console.log('1️⃣  REGISTER PARENT');
    const registerParentRes = await requestJson(`${base}/api/auth/register`, 'POST', {
      email: parentEmail,
      password: parentPassword,
      name: 'Parent Full Test',
      role: 'parent'
    });
    if (![200, 201, 400].includes(registerParentRes.status)) {
      throw new Error(`register parent failed ${registerParentRes.status}`);
    }
    console.log(`✓ Status: ${registerParentRes.status}`);

    // 2. Register student
    console.log('\n2️⃣  REGISTER STUDENT');
    const registerStudentRes = await requestJson(`${base}/api/auth/register`, 'POST', {
      email: studentEmail,
      password: studentPassword,
      name: 'Student Full Test',
      role: 'student'
    });
    if (![200, 201, 400].includes(registerStudentRes.status)) {
      throw new Error(`register student failed ${registerStudentRes.status}`);
    }
    console.log(`✓ Status: ${registerStudentRes.status}`);

    // 3. Login parent
    console.log('\n3️⃣  LOGIN PARENT');
    const parentLoginRes = await requestJson(`${base}/api/auth/login`, 'POST', {
      email: parentEmail,
      password: parentPassword
    });
    if (parentLoginRes.status !== 200) {
      throw new Error(`parent login failed ${parentLoginRes.status}: ${JSON.stringify(parentLoginRes.data)}`);
    }
    const parentCookie = parentLoginRes.headers.get('set-cookie')?.split(';')[0];
    if (!parentCookie) throw new Error('missing parent cookie');
    console.log(`✓ Status: 200`);
    console.log(`✓ Cookie received`);

    // 4. GET /api/parent/me
    console.log('\n4️⃣  GET /api/parent/me');
    const meRes = await fetch(`${base}/api/parent/me`, { headers: { Cookie: parentCookie } });
    const meData = await meRes.json();
    if (meRes.status !== 200) {
      throw new Error(`me failed ${meRes.status}`);
    }
    console.log(`✓ Status: 200`);
    console.log(`✓ Profile: ${meData?.name} (${meData?.email})`);

    // 5. GET /api/parent/dashboard
    console.log('\n5️⃣  GET /api/parent/dashboard');
    const dashRes = await fetch(`${base}/api/parent/dashboard`, { headers: { Cookie: parentCookie } });
    const dashData = await dashRes.json();
    if (dashRes.status !== 200) {
      throw new Error(`dashboard failed ${dashRes.status}`);
    }
    if (!dashData?.parent || !dashData?.children || !dashData?.quick_stats) {
      throw new Error(`dashboard missing fields`);
    }
    console.log(`✓ Status: 200`);
    console.log(`✓ Children: ${dashData.children.length}`);
    console.log(`✓ Quick stats: ${JSON.stringify(dashData.quick_stats)}`);

    // 6. GET /api/parent/children
    console.log('\n6️⃣  GET /api/parent/children');
    const childrenRes = await fetch(`${base}/api/parent/children`, { headers: { Cookie: parentCookie } });
    const childrenBody = await childrenRes.json();
    if (childrenRes.status !== 200) {
      throw new Error(`children failed ${childrenRes.status}`);
    }
    const childrenData = childrenBody.children || [];
    if (!Array.isArray(childrenData)) {
      throw new Error(`children not array`);
    }
    console.log(`✓ Status: 200`);
    console.log(`✓ Children count: ${childrenData.length}`);

    let childId = null;
    if (childrenData.length === 0) {
      console.log('⚠️  No linked children. Skipping child-specific tests.');
    } else {
      childId = childrenData[0]?.id;
      console.log(`✓ Using child ID: ${childId}`);

      // 7. GET /api/parent/children/[id]/progress
      console.log('\n7️⃣  GET /api/parent/children/{id}/progress');
      const progressRes = await fetch(`${base}/api/parent/children/${childId}/progress`, {
        headers: { Cookie: parentCookie }
      });
      const progressBody = await progressRes.json();
      if (progressRes.status !== 200) {
        throw new Error(`progress failed ${progressRes.status}`);
      }
      const progressData = progressBody.progress || progressBody;
      console.log(`✓ Status: 200`);
      console.log(`✓ Total lessons: ${progressData?.total_lessons}`);
      console.log(`✓ Completed: ${progressData?.completed}`);

      // 8. GET /api/parent/children/[id]/quizzes
      console.log('\n8️⃣  GET /api/parent/children/{id}/quizzes');
      const quizzesRes = await fetch(`${base}/api/parent/children/${childId}/quizzes`, {
        headers: { Cookie: parentCookie }
      });
      const quizzesBody = await quizzesRes.json();
      if (quizzesRes.status !== 200) {
        throw new Error(`quizzes failed ${quizzesRes.status}`);
      }
      const quizzesData = quizzesBody.quizzes || [];
      if (!Array.isArray(quizzesData)) {
        throw new Error(`quizzes not array`);
      }
      console.log(`✓ Status: 200`);
      console.log(`✓ Quiz attempts: ${quizzesData.length}`);

      // 9. GET /api/parent/children/[id]/badges
      console.log('\n9️⃣  GET /api/parent/children/{id}/badges');
      const badgesRes = await fetch(`${base}/api/parent/children/${childId}/badges`, {
        headers: { Cookie: parentCookie }
      });
      const badgesBody = await badgesRes.json();
      if (badgesRes.status !== 200) {
        throw new Error(`badges failed ${badgesRes.status}`);
      }
      const badgesData = badgesBody.badges || [];
      if (!Array.isArray(badgesData)) {
        throw new Error(`badges not array`);
      }
      console.log(`✓ Status: 200`);
      console.log(`✓ Badges earned: ${badgesData.length}`);

      // 10. GET /api/parent/children/[id]/terms
      console.log('\n🔟 GET /api/parent/children/{id}/terms');
      const termsRes = await fetch(`${base}/api/parent/children/${childId}/terms`, {
        headers: { Cookie: parentCookie }
      });
      const termsBody = await termsRes.json();
      if (termsRes.status !== 200) {
        throw new Error(`terms failed ${termsRes.status}`);
      }
      const termsData = termsBody.terms || [];
      if (!Array.isArray(termsData)) {
        throw new Error(`terms not array`);
      }
      console.log(`✓ Status: 200`);
      console.log(`✓ Terms: ${termsData.length}`);
    }

    // 11. GET /api/parent/payments
    console.log('\n1️⃣1️⃣  GET /api/parent/payments');
    const paymentsRes = await fetch(`${base}/api/parent/payments`, { headers: { Cookie: parentCookie } });
    const paymentsBody = await paymentsRes.json();
    if (paymentsRes.status !== 200) {
      throw new Error(`payments failed ${paymentsRes.status}`);
    }
    const paymentsData = paymentsBody.payments || [];
    if (!Array.isArray(paymentsData)) {
      throw new Error(`payments not array`);
    }
    console.log(`✓ Status: 200`);
    console.log(`✓ Payments: ${paymentsData.length}`);

    // 12. POST /api/parent/payments
    console.log('\n1️⃣2️⃣  POST /api/parent/payments');
    const createPaymentRes = await requestJson(`${base}/api/parent/payments`, 'POST', {
      plan_type_id: 1,
      payment_method_id: 1,
      amount: 999
    }, { Cookie: parentCookie });
    if (createPaymentRes.status !== 201 && createPaymentRes.status !== 200) {
      throw new Error(`create payment failed ${createPaymentRes.status}`);
    }
    console.log(`✓ Status: ${createPaymentRes.status}`);
    console.log(`✓ Payment created`);

    console.log('\n========== ✅ ALL TESTS PASSED ==========\n');
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
})();
