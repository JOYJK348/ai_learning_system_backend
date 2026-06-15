Student APIs — Full List
Table
#	API	Method	What
1	/api/student/me	GET	My profile
2	/api/student/lessons	GET	My unlocked lessons
3	/api/student/lessons/[id]	GET	Lesson detail + video
4	/api/student/lessons/[id]/progress	POST	Update progress (watched seconds)
5	/api/student/activities/[lesson_id]	GET	Activities for lesson
6	/api/student/activities/[id]/attempt	POST	Submit activity
7	/api/student/quizzes/[lesson_id]	GET	Quizzes for lesson
8	/api/student/quizzes/[id]/attempt	POST	Submit quiz answers
9	/api/student/badges	GET	My earned badges
10	/api/student/terms	GET	My term unlock status
Code Kudukala? 🚀
Files create pannanum:
src/app/api/student/me/route.ts
src/app/api/student/lessons/route.ts
src/app/api/student/lessons/[id]/route.ts
src/app/api/student/lessons/[id]/progress/route.ts
src/app/api/student/activities/[lesson_id]/route.ts
src/app/api/student/activities/[id]/attempt/route.ts
src/app/api/student/quizzes/[lesson_id]/route.ts
src/app/api/student/quizzes/[id]/attempt/route.ts
src/app/api/student/badges/route.ts
src/app/api/student/terms/route.ts
Ready ah? Sollu, start pannren! 💪
Or first student.ts shared logic file kudukala? 🎯
https://ai-learning-system-pi.vercel.app/en/student/Home
https://ai-learning-system-pi.vercel.app/en/student/Learn
https://ai-learning-system-pi.vercel.app/en/student/Quiz
https://ai-learning-system-pi.vercel.app/en/student/profile

analyse this da,idha hardcore ah vachi backend ne kuduthadhu okay va or vera edhum add pananum ah da?
Edit
Copy
Share
Dei, frontend romba nalla iruku da! 🔥 But backend ku neriya add pannanum!
Analyse Panna
Table
URL	Page	Backend Need
/student/Home	Dashboard	GET /api/student/dashboard ⬜ MISSING
/student/Learn	Lessons list	GET /api/student/lessons ✅
/student/Quiz	Quiz page	GET /api/student/quizzes/[id] ✅
/student/profile	Profile	GET /api/student/me ✅
Missing APIs (Critical)
Table
API	Why	Status
GET /api/student/dashboard	Home page ku stats, streak, recent activity	🔴 MISSING
POST /api/student/lessons/[id]/progress	Video watch progress save	🔴 MISSING
POST /api/student/activities/[id]/attempt	Activity submit	🔴 MISSING
POST /api/student/quizzes/[id]/attempt	Quiz submit	🔴 MISSING
GET /api/student/terms	Term unlock status	🔴 MISSING
Student Dashboard Need
JSON
GET /api/student/dashboard

{
  "student": {
    "name": "Kid Kumar",
    "grade": "LKG",
    "overall_progress": 65,
    "total_stars": 45,
    "total_badges": 5,
    "current_streak": 3,
    "max_streak": 7
  },
  "todays_lessons": [
    {
      "id": "lesson-uuid",
      "title": "A for Apple",
      "thumbnail": "https://...",
      "progress": 50,
      "status": "in_progress"
    }
  ],
  "recent_activity": {
    "last_lesson": "B for Ball",
    "last_quiz_score": "8/10",
    "last_badge": "First Steps"
  },
  "next_unlock": {
    "lesson": "C for Cat",
    "requires": "Complete B for Ball"
  }
}
Add Pannanum
Table
Priority	API	Time
🔴 1	GET /api/student/dashboard	1 hr
🔴 2	POST /api/student/lessons/[id]/progress	1 hr
🔴 3	POST /api/student/activities/[id]/attempt	1 hr
🔴 4	POST /api/student/quizzes/[id]/attempt	1 hr
🟡 5	GET /api/student/terms	30 min
