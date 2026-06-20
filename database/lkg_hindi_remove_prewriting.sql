-- ═══════════════════════════════════════════════════════════════════════════════
-- LKG HINDI — REMOVE PRE-WRITING CHAPTER & LESSONS (already removed from code)
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
    subj_id UUID;
    ch_id   UUID;
BEGIN
    subj_id := (SELECT s.id FROM subjects s JOIN grades g ON s.grade_id = g.id WHERE g.code = 'lkg' AND s.code = 'hindi');
    IF subj_id IS NULL THEN
        RAISE EXCEPTION 'Hindi subject not found';
    END IF;

    ch_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'पूर्व लेखन अभ्यास' AND deleted_at IS NULL);
    IF ch_id IS NOT NULL THEN
        -- Soft delete all lessons in this chapter
        UPDATE lessons SET deleted_at = NOW() WHERE chapter_id = ch_id AND deleted_at IS NULL;
        -- Soft delete the chapter
        UPDATE chapters SET deleted_at = NOW() WHERE id = ch_id AND deleted_at IS NULL;
        RAISE NOTICE 'Deleted pre-writing chapter and % lessons', (SELECT COUNT(*) FROM lessons WHERE chapter_id = ch_id);
    ELSE
        RAISE NOTICE 'Pre-writing chapter not found — already deleted or never created';
    END IF;
END $$;
