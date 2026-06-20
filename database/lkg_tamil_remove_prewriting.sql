-- ═══════════════════════════════════════════════════════════════════════════════
-- LKG TAMIL — REMOVE PRE-WRITING CHAPTER & LESSONS
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
    subj_id UUID;
    ch_id   UUID;
BEGIN
    subj_id := (SELECT s.id FROM subjects s JOIN grades g ON s.grade_id = g.id WHERE g.code = 'lkg' AND s.code = 'tamil');
    IF subj_id IS NULL THEN
        RAISE EXCEPTION 'Tamil subject not found';
    END IF;

    ch_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'முன் எழுத்து பயிற்சிகள் - Guide & Trace' AND deleted_at IS NULL);
    IF ch_id IS NOT NULL THEN
        -- Soft delete all lessons in this chapter
        UPDATE lessons SET deleted_at = NOW() WHERE chapter_id = ch_id AND deleted_at IS NULL;
        -- Soft delete the chapter
        UPDATE chapters SET deleted_at = NOW() WHERE id = ch_id AND deleted_at IS NULL;
        RAISE NOTICE 'Deleted Tamil pre-writing chapter and its lessons successfully.';
    ELSE
        RAISE NOTICE 'Tamil Pre-writing chapter not found — already deleted or never created';
    END IF;
END $$;
