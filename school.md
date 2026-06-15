Dei, School Admin APIs — full list kudukren! 🎯
School Admin — Complete API List
Super Admin Only (Creates School + Assigns Admin)
Table
API	Method	What
/api/admin/schools	POST	Create school
/api/admin/schools	GET	List all schools
/api/admin/schools/[id]	GET	School details
/api/admin/schools/[id]	PUT	Update school
/api/admin/schools/[id]	DELETE	Soft delete school
/api/admin/school-admins	POST	Create school admin (assign to school)
/api/admin/school-admins	GET	List all school admins
School Admin (Own School Only)
Table
API	Method	What
/api/school-admin/me	GET	My profile + my school info
/api/school-admin/dashboard	GET	My school stats
/api/school-admin/students	GET	List students in MY school
/api/school-admin/students	POST	Add student to MY school
/api/school-admin/students/[id]	GET	Student details
/api/school-admin/students/[id]	PUT	Update student (roll, section, grade)
/api/school-admin/students/[id]	DELETE	Remove student from MY school
/api/school-admin/parents	GET	List parents of MY school students
/api/school-admin/progress	GET	Progress report of all MY students
School Admin Dashboard Stats
JSON
{
  "my_school": {
    "id": "school-uuid",
    "name": "ABC Matriculation",
    "code": "abc-matric",
    "city": "Chennai",
    "total_students": 150,
    "max_students": 200,
    "plan_status": "active"
  },
  "students_by_grade": {
    "LKG": 50,
    "UKG": 50,
    "Grade 1": 50
  },
  "students_by_section": {
    "A": 25,
    "B": 25,
    "C": 25,
    "D": 25
  },
  "term_stats": {
    "active_terms": 120,
    "completed_terms": 45,
    "pending_unlocks": 15
  },
  "recent_activity": {
    "lessons_completed_today": 45,
    "quizzes_attempted_today": 30,
    "new_badges_today": 12
  }
}
Code Kudukala? 🚀
Files create pannanum:
src/app/api/admin/schools/route.ts (POST, GET)
src/app/api/admin/schools/[id]/route.ts (GET, PUT, DELETE)
src/app/api/admin/school-admins/route.ts (POST, GET)
src/app/api/school-admin/me/route.ts (GET)
src/app/api/school-admin/dashboard/route.ts (GET)
src/app/api/school-admin/students/route.ts (GET, POST)
src/app/api/school-admin/students/[id]/route.ts (GET, PUT, DELETE)
Ready ah? Sollu, code kudukren! 💪
