🔥 Next Step 4: Parent APIs
Need these:
Table
API	Method	What
/api/parent/me	GET	My profile
/api/parent/children	GET	My kids list
/api/parent/children/[id]/progress	GET	Kid's lesson progress
/api/parent/children/[id]/quizzes	GET	Kid's quiz attempts
/api/parent/children/[id]/badges	GET	Kid's earned badges
/api/parent/children/[id]/terms	GET	Kid's term unlock status
/api/parent/payments	GET	My payment history
/api/parent/payments	POST	Make new payment
Parent Dashboard Data
JSON
{
  "parent": {
    "name": "Parent Kumar",
    "email": "parent@email.com",
    "plan_type": "paid",
    "plan_expires": "2026-12-31"
  },
  "children": [
    {
      "id": "student-uuid",
      "name": "Kid Kumar",
      "grade": "LKG",
      "school": "ABC Matriculation",
      "overall_progress": 65,
      "lessons_completed": 12,
      "quizzes_passed": 8,
      "total_stars": 45,
      "badges_earned": 5,
      "current_streak": 3,
      "terms": [
        {
          "term": "Term 1",
          "status": "active",
          "completion": 70
        }
      ]
    }
  ],
  "payments": [
    {
      "amount": 999,
      "status": "success",
      "date": "2026-06-01"
    }
  ]
}
Code Kudukala? 🚀
Files:
src/app/api/parent/me/route.ts
src/app/api/parent/children/route.ts
src/app/api/parent/children/[id]/progress/route.ts
src/app/api/parent/children/[id]/quizzes/route.ts
src/app/api/parent/children/[id]/badges/route.ts
src/app/api/parent/children/[id]/terms/route.ts
src/app/api/parent/payments/route.ts
Ready ah? Sollu, start pannren! 💪
