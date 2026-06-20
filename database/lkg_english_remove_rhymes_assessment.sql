-- ═══════════════════════════════════════════════════════════════════════════════
-- LKG ENGLISH — REMOVE RHYMES & FINAL ASSESSMENT CHAPTERS
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
    subj_id UUID;
    ch_rhymes_id   UUID;
    ch_assess_id   UUID;
BEGIN
    subj_id := (SELECT s.id FROM subjects s JOIN grades g ON s.grade_id = g.id WHERE g.code = 'lkg' AND s.code = 'english');
    IF subj_id IS NULL THEN
        RAISE EXCEPTION 'English subject not found';
    END IF;

    -- Delete "Rhymes" chapter
    ch_rhymes_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'Rhymes' AND deleted_at IS NULL);
    IF ch_rhymes_id IS NOT NULL THEN
        UPDATE lessons SET deleted_at = NOW() WHERE chapter_id = ch_rhymes_id AND deleted_at IS NULL;
        UPDATE chapters SET deleted_at = NOW() WHERE id = ch_rhymes_id AND deleted_at IS NULL;
        RAISE NOTICE 'Deleted English "Rhymes" chapter and its lessons successfully.';
    ELSE
        RAISE NOTICE 'English "Rhymes" chapter not found — already deleted or never created';
    END IF;

    -- Delete "Final Assessment" chapter
    ch_assess_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'Final Assessment' AND deleted_at IS NULL);
    IF ch_assess_id IS NOT NULL THEN
        UPDATE lessons SET deleted_at = NOW() WHERE chapter_id = ch_assess_id AND deleted_at IS NULL;
        UPDATE chapters SET deleted_at = NOW() WHERE id = ch_assess_id AND deleted_at IS NULL;
        RAISE NOTICE 'Deleted English "Final Assessment" chapter and its lessons successfully.';
    ELSE
        RAISE NOTICE 'English "Final Assessment" chapter not found — already deleted or never created';
    END IF;
END $$;
