# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# architecture
- Use React Query with memory cache + sessionStorage persistence for API data; use typed query keys, background refetch, mutation invalidation, and cache cleanup on logout. Confidence: 0.75
- Use admin API service (`adminApi.ts`) for centralized API calls shared between pages and prefetch logic. Confidence: 0.70
- Prefetch important API data after login/auth confirmation (dashboard, schools, students, parents, payments first; reports, curriculum, quizzes, videos, activities next). Confidence: 0.70

# communication
- User converses in Tanglish (Tamil-English mix) with casual familiarity ("da"). Address responses in kind, using Tanglish with occasional Tamil words. Confidence: 0.85

# ui
- Use bold, large, and visually clear fonts for kid-facing UI elements (balloon game letters, activity labels) — kid's educational app should prioritize readability with larger font sizes and bold weight. Confidence: 0.70
- For letter activities, maintain separate uppercase and lowercase modes — uppercase activities use capital letter shapes (A, B, C), lowercase activities use small letter shapes (a, b, c); do NOT globally apply lowercase to uppercase activities or mix both cases in one activity. Confidence: 0.85

