-- Remove Animal Sounds lesson that was removed from EVS curriculum
DO $$
DECLARE
    l_id UUID;
BEGIN
    SELECT id INTO l_id FROM lessons WHERE title = 'Animal Sounds' AND deleted_at IS NULL LIMIT 1;
    IF l_id IS NOT NULL THEN
        DELETE FROM quiz_options WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE lesson_id = l_id));
        DELETE FROM quiz_questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE lesson_id = l_id);
        DELETE FROM quizzes WHERE lesson_id = l_id;
        DELETE FROM activities WHERE lesson_id = l_id;
        DELETE FROM lesson_progress WHERE lesson_id = l_id;
        UPDATE lessons SET deleted_at = NOW() WHERE id = l_id;
    END IF;
END $$;
