ZHI APP — COMPLETE BACKEND PLAN
Users (4 Types)
Table
User	Role	What They Do
Super Admin	super_admin	Platform owner. Creates schools, manages everything
School Admin	school_admin	Principal/Teacher. Manages ONLY their school students
Parent	parent	Individual or school parent. Tracks kids progress
Student	student	Kid who learns. Watches videos, does activities, quizzes
Backend APIs — Complete List
STEP 1: AUTH (Already Done ✅)
plain
POST /api/auth/login          → Login + JWT cookie
POST /api/auth/register       → Sign up (role: super_admin/school_admin/parent/student)
POST /api/auth/logout         → Clear cookie
POST /api/auth/otp/send       → Send OTP to email/phone
POST /api/auth/otp/verify     → Verify OTP
GET  /api/auth/me             → Who am I? (current user info)
GET  /api/auth/refresh        → Refresh JWT token
STEP 2: CURRICULUM (Public + Admin)
Public APIs (No login needed):
plain
GET /api/boards               → List boards (CBSE, ICSE, etc.)
GET /api/grades?board_id=xxx  → List grades by board (LKG, UKG, Grade 1)
GET /api/subjects?grade_id=xxx → List subjects by grade (English, Maths, etc.)
GET /api/chapters?subject_id=xxx → List chapters by subject
GET /api/lessons?chapter_id=xxx → List lessons by chapter
GET /api/lessons/[id]         → Single lesson details (video, description)
Admin APIs (Login required):
plain
POST /api/admin/boards        → Create board
PUT  /api/admin/boards/[id]  → Edit board
DELETE /api/admin/boards/[id] → Soft delete board

POST /api/admin/grades        → Create grade
PUT  /api/admin/grades/[id]  → Edit grade
DELETE /api/admin/grades/[id] → Soft delete grade

(Same for subjects, chapters, lessons)
STEP 3: SCHOOL ADMIN (New — You Asked!)
Super Admin Only:
plain
GET  /api/admin/schools              → List ALL schools
POST /api/admin/schools              → Create school (name, code, city, max_students)
GET  /api/admin/schools/[id]         → School details
PUT  /api/admin/schools/[id]        → Update school
DELETE /api/admin/schools/[id]      → Soft delete school

GET  /api/admin/school-admins        → List ALL school admins
POST /api/admin/school-admins        → Create school admin (assign to school)
PUT  /api/admin/school-admins/[id]  → Update school admin
DELETE /api/admin/school-admins/[id] → Remove school admin
School Admin (Own School Only):
plain
GET  /api/school-admin/me            → My profile + my school info
GET  /api/school-admin/dashboard     → My school stats (students, progress, terms)

GET  /api/school-admin/students      → List students in MY school
POST /api/school-admin/students      → Add student to MY school (roll number, section, grade)
PUT  /api/school-admin/students/[id] → Update student (roll, section, grade)
DELETE /api/school-admin/students/[id] → Remove student from MY school

GET  /api/school-admin/parents       → List parents of MY school students
GET  /api/school-admin/progress      → Progress report of all MY students
GET  /api/school-admin/terms          → Term unlock status of MY students
School Admin Dashboard Stats:
JSON
{
  "my_school": "ABC School",
  "total_students": 150,
  "students_by_grade": {
    "LKG": 50,
    "UKG": 50,
    "Grade 1": 50
  },
  "students_by_section": {
    "A": 25, "B": 25, "C": 25, "D": 25
  },
  "active_terms": 120,
  "completed_terms": 45,
  "pending_approvals": 5,
  "revenue_this_month": 25000
}
STEP 4: PARENT
plain
GET  /api/parent/me              → My profile
GET  /api/parent/children        → My kids list
GET  /api/parent/children/[id]/progress → Kid's progress (lessons, quizzes, badges)
GET  /api/parent/children/[id]/terms   → Kid's term unlock status
POST /api/parent/payments        → Make payment
GET  /api/parent/payments        → My payment history
STEP 5: STUDENT
plain
GET  /api/student/me             → My profile
GET  /api/student/lessons        → My unlocked lessons
GET  /api/student/lessons/[id]   → Lesson details + video
POST /api/student/lessons/[id]/progress → Update progress (watched seconds, completed)
GET  /api/student/activities/[lesson_id] → Activities for lesson
POST /api/student/activities/[id]/attempt → Submit activity
GET  /api/student/quizzes/[lesson_id] → Quizzes for lesson
POST /api/student/quizzes/[id]/attempt → Submit quiz answers
GET  /api/student/badges         → My earned badges
GET  /api/student/terms          → My term unlock status
STEP 6: ADMIN CRUD (Super Admin)
plain
GET  /api/admin/dashboard        → Platform stats (total students, parents, schools, revenue)
GET  /api/admin/users            → List all users (filter by role)
GET  /api/admin/payments         → All payments (filter by status)
PUT  /api/admin/payments/[id]    → Verify payment manually
GET  /api/admin/approvals        → Pending parent approvals
PUT  /api/admin/approvals/[id]   → Approve/reject parent
GET  /api/admin/logs             → Admin activity logs
Super Admin Dashboard Stats:
JSON
{
  "total_students": 5000,
  "total_parents": 2500,
  "total_schools": 15,
  "total_school_admins": 45,
  "total_lessons": 1200,
  "total_revenue": 500000,
  "pending_approvals": 25,
  "plans_expiring_soon": 30
}
STEP 7: PAYMENTS
plain
POST /api/payments/create        → Create payment order (Razorpay/Stripe)
POST /api/payments/verify        → Verify payment signature
POST /api/payments/webhook       → Payment gateway webhook
GET  /api/payments/plans         → List subscription plans
STEP 8: FILE UPLOAD
plain
POST /api/upload/image           → Upload image (thumbnail, profile photo)
POST /api/upload/video           → Upload video (or store YouTube URL)
GET  /api/upload/[id]            → Get file URL
Security (All APIs)
Table
Layer	What
Middleware	Check JWT token on every request
RLS	Database level (Supabase)
Role Check	API level (is_admin(), is_school_admin())
Rate Limit	5 requests per minute (login)
OTP	Required for signup
Audit Log	Every action logged
Order to Build
Table
Priority	Step	Time
🔴 1	Curriculum APIs (boards → lessons)	2 hrs
🔴 2	School Admin APIs (your request!)	2 hrs
🟡 3	Student APIs (progress, attempts)	2 hrs
🟡 4	Parent APIs (kids, payments)	1 hr
🟡 5	Super Admin CRUD (dashboard, users)	2 hrs
🟢 6	Payment API (Razorpay)	2 hrs
🟢 7	File Upload	1 hr
Start Now?
Enna first venam?
A) Curriculum APIs (boards, grades, subjects, chapters, lessons)
B) School Admin APIs (dashboard, students, my school)
C) Both together
