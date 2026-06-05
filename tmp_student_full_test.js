const fetch = global.fetch;

(async () => {
  try {
    const base = 'http://localhost:3010';
    const timestamp = Date.now();
    const studentEmail = `student-full-test-${timestamp}@zhi.com`;
    const studentPassword = 'Student123!';

    const requestJson = async (url, method, body, headers = {}) => {
      const res = await fetch(url, {
        method,
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: body ? JSON.stringify(body) : undefined
      });
      let data;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      return { res, data, status: res.status, headers: res.headers };
    };

    console.log('\n========== STUDENT FULL API TEST ==========\n');

    // 0. Get first available grade (or use hardcoded if exists)
    let gradeId = 'grade-001'; // Default fallback
    try {
      const gradesRes = await fetch(`${base}/api/grades`);
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        if (gradesData?.grades?.length > 0) {
          gradeId = gradesData.grades[0]?.id;
        }
      }
    } catch (e) {
      console.log('⚠️  Could not fetch grades, using default');
    }

    // 1. Register student
    console.log('1️⃣  REGISTER STUDENT');
    const registerRes = await requestJson(`${base}/api/auth/register`, 'POST', {
      email: studentEmail,
      password: studentPassword,
      name: 'Student Full Test',
      role: 'student'
      // gradeId optional - will be null if not provided
    });
    console.log('Register response:', registerRes.status, registerRes.data);
    if (![200, 201, 400].includes(registerRes.status)) {
      throw new Error(`register student failed ${registerRes.status}: ${JSON.stringify(registerRes.data)}`);
    }
    console.log(`✓ Status: ${registerRes.status}`);

    // 2. Login student
    console.log('\n2️⃣  LOGIN STUDENT');
    const loginRes = await requestJson(`${base}/api/auth/login`, 'POST', {
      email: studentEmail,
      password: studentPassword
    });
    if (loginRes.status !== 200) {
      throw new Error(`student login failed ${loginRes.status}`);
    }
    const studentCookie = loginRes.headers.get('set-cookie')?.split(';')[0];
    if (!studentCookie) throw new Error('missing student cookie');
    console.log(`✓ Status: 200`);
    console.log(`✓ Cookie received`);

    // 3. GET /api/student/me
    console.log('\n3️⃣  GET /api/student/me');
    const meRes = await fetch(`${base}/api/student/me`, { headers: { Cookie: studentCookie } });
    const meData = await meRes.json();
    if (meRes.status !== 200) {
      throw new Error(`me failed ${meRes.status}`);
    }
    if (!meData?.student) throw new Error('missing student data');
    console.log(`✓ Status: 200`);
    console.log(`✓ Profile: ${meData.student?.name}`);
    console.log(`✓ Grade: ${meData.student?.grade}`);

    // 4. GET /api/student/dashboard
    console.log('\n4️⃣  GET /api/student/dashboard');
    const dashRes = await fetch(`${base}/api/student/dashboard`, { headers: { Cookie: studentCookie } });
    const dashData = await dashRes.json();
    if (dashRes.status !== 200) {
      throw new Error(`dashboard failed ${dashRes.status}`);
    }
    if (!dashData?.student || !dashData?.todays_lessons || !dashData?.recent_activity) {
      throw new Error('dashboard missing fields');
    }
    console.log(`✓ Status: 200`);
    console.log(`✓ Student: ${dashData.student?.name}`);
    console.log(`✓ Today's lessons: ${dashData.todays_lessons?.length || 0}`);
    console.log(`✓ Streak: ${dashData.student?.current_streak}`);

    // 5. GET /api/student/lessons
    console.log('\n5️⃣  GET /api/student/lessons');
    const lessonsRes = await fetch(`${base}/api/student/lessons`, { headers: { Cookie: studentCookie } });
    const lessonsBody = await lessonsRes.json();
    if (lessonsRes.status !== 200) {
      throw new Error(`lessons failed ${lessonsRes.status}`);
    }
    const lessonsList = lessonsBody.lessons || [];
    if (!Array.isArray(lessonsList)) throw new Error('lessons not array');
    console.log(`✓ Status: 200`);
    console.log(`✓ Lessons count: ${lessonsList.length}`);

    let lessonId = lessonsList?.[0]?.id;
    if (lessonId) {
      console.log(`✓ Using lesson ID: ${lessonId}`);

      // 6. GET /api/student/lessons/[id]
      console.log('\n6️⃣  GET /api/student/lessons/{id}');
      const lessonRes = await fetch(`${base}/api/student/lessons/${lessonId}`, {
        headers: { Cookie: studentCookie }
      });
      const lessonData = await lessonRes.json();
      if (lessonRes.status !== 200) {
        throw new Error(`lesson failed ${lessonRes.status}`);
      }
      if (!lessonData?.lesson) throw new Error('lesson missing data');
      console.log(`✓ Status: 200`);
      console.log(`✓ Lesson: ${lessonData.lesson?.title}`);
      console.log(`✓ Progress: ${lessonData.lesson?.progress}%`);

      // 7. POST /api/student/lessons/[id]/progress
      console.log('\n7️⃣  POST /api/student/lessons/{id}/progress');
      const progressRes = await requestJson(
        `${base}/api/student/lessons/${lessonId}/progress`,
        'POST',
        { watched_seconds: 120 },
        { Cookie: studentCookie }
      );
      if (progressRes.status !== 200) {
        throw new Error(`progress update failed ${progressRes.status}`);
      }
      if (!progressRes.data?.progress) throw new Error('progress missing data');
      console.log(`✓ Status: 200`);
      console.log(`✓ Watched: ${progressRes.data.progress?.watched_seconds}s`);
      console.log(`✓ Progress: ${progressRes.data.progress?.progress_percentage}%`);

      // 8. GET /api/student/lessons/[lesson_id]/activities
      console.log('\n8️⃣  GET /api/student/lessons/{id}/activities');
      const activitiesRes = await fetch(`${base}/api/student/lessons/${lessonId}/activities`, {
        headers: { Cookie: studentCookie }
      });
      const activitiesBody = await activitiesRes.json();
      if (activitiesRes.status !== 200) {
        throw new Error(`activities failed ${activitiesRes.status}`);
      }
      const activitiesList = activitiesBody.activities || [];
      if (!Array.isArray(activitiesList)) throw new Error('activities not array');
      console.log(`✓ Status: 200`);
      console.log(`✓ Activities count: ${activitiesList.length}`);

      if (activitiesList.length > 0) {
        const activityId = activitiesList[0]?.id;
        console.log(`✓ Using activity ID: ${activityId}`);

        // 9. POST /api/student/lessons/[lesson_id]/activities/[activity_id]/attempt
        console.log('\n9️⃣  POST /api/student/lessons/{id}/activities/{activityId}/attempt');
        const activityRes = await requestJson(
          `${base}/api/student/lessons/${lessonId}/activities/${activityId}/attempt`,
          'POST',
          { answer: 'Test answer' },
          { Cookie: studentCookie }
        );
        if (activityRes.status !== 201 && activityRes.status !== 200) {
          throw new Error(`activity submit failed ${activityRes.status}`);
        }
        console.log(`✓ Status: ${activityRes.status}`);
        console.log(`✓ Activity submitted`);
      }

      // 10. GET /api/student/lessons/[lesson_id]/quizzes
      console.log('\n🔟 GET /api/student/lessons/{id}/quizzes');
      const quizzesRes = await fetch(`${base}/api/student/lessons/${lessonId}/quizzes`, {
        headers: { Cookie: studentCookie }
      });
      const quizzesBody = await quizzesRes.json();
      if (quizzesRes.status !== 200) {
        throw new Error(`quizzes failed ${quizzesRes.status}`);
      }
      const quizzesList = quizzesBody.quizzes || [];
      if (!Array.isArray(quizzesList)) throw new Error('quizzes not array');
      console.log(`✓ Status: 200`);
      console.log(`✓ Quizzes count: ${quizzesList.length}`);

      if (quizzesList.length > 0) {
        const quizId = quizzesList[0]?.id;
        console.log(`✓ Using quiz ID: ${quizId}`);

        // 11. POST /api/student/lessons/[lesson_id]/quizzes/[quiz_id]/attempt
        console.log('\n1️⃣1️⃣  POST /api/student/lessons/{id}/quizzes/{quizId}/attempt');
        const quizRes = await requestJson(
          `${base}/api/student/lessons/${lessonId}/quizzes/${quizId}/attempt`,
          'POST',
          { answers: { 'q1': 'A', 'q2': 'B' } },
          { Cookie: studentCookie }
        );
        if (quizRes.status !== 201 && quizRes.status !== 200) {
          throw new Error(`quiz submit failed ${quizRes.status}`);
        }
        console.log(`✓ Status: ${quizRes.status}`);
        console.log(`✓ Score: ${quizRes.data?.attempt?.score}/${quizRes.data?.attempt?.max_score}`);
        console.log(`✓ Percentage: ${quizRes.data?.attempt?.percentage}%`);
        console.log(`✓ Passed: ${quizRes.data?.attempt?.passed}`);
      }
    } else {
      console.log('⚠️  No lessons available. Skipping lesson-specific tests.');
    }

    // 12. GET /api/student/badges
    console.log('\n1️⃣2️⃣  GET /api/student/badges');
    const badgesRes = await fetch(`${base}/api/student/badges`, { headers: { Cookie: studentCookie } });
    const badgesBody = await badgesRes.json();
    if (badgesRes.status !== 200) {
      throw new Error(`badges failed ${badgesRes.status}`);
    }
    const badgesList = badgesBody.badges || [];
    if (!Array.isArray(badgesList)) throw new Error('badges not array');
    console.log(`✓ Status: 200`);
    console.log(`✓ Badges earned: ${badgesList.length}`);

    // 13. GET /api/student/terms
    console.log('\n1️⃣3️⃣  GET /api/student/terms');
    const termsRes = await fetch(`${base}/api/student/terms`, { headers: { Cookie: studentCookie } });
    const termsBody = await termsRes.json();
    if (termsRes.status !== 200) {
      throw new Error(`terms failed ${termsRes.status}`);
    }
    const termsList = termsBody.terms || [];
    if (!Array.isArray(termsList)) throw new Error('terms not array');
    console.log(`✓ Status: 200`);
    console.log(`✓ Terms: ${termsList.length}`);

    console.log('\n========== ✅ ALL TESTS PASSED ==========\n');
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
})();
