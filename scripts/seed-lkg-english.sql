-- ═══════════════════════════════════════════════════════════════════════════════
-- LKG ENGLISH CURRICULUM SEED
-- Board: CBSE | Grade: LKG | Subject: English
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    active_status_id INT := (SELECT id FROM lookup_entity_status WHERE code = 'active');
    board_id UUID := (SELECT id FROM boards WHERE code = 'cbse');
    grade_id UUID := (SELECT id FROM grades WHERE board_id = board_id AND code = 'lkg');
    subject_id UUID := (SELECT id FROM subjects WHERE grade_id = grade_id AND code = 'english');
    
    ch_term1 UUID;
    ch_term2 UUID;
    ch_term3 UUID;
    ch_rhymes UUID;
    ch_stories UUID;
BEGIN
    -- Verify subject exists
    IF subject_id IS NULL THEN
        RAISE EXCEPTION 'LKG English subject not found. Run final.sql first.';
    END IF;

    -- ─── CHAPTERS ───
    INSERT INTO chapters (subject_id, name, sort_order, status_id)
    VALUES 
        (subject_id, 'Term 1: Letters A-M', 1, active_status_id),
        (subject_id, 'Term 2: Letters N-Z', 2, active_status_id),
        (subject_id, 'Term 3: Small Letters & Phonics', 3, active_status_id),
        (subject_id, 'Rhymes & Songs', 4, active_status_id),
        (subject_id, 'Story Time', 5, active_status_id)
    ON CONFLICT (subject_id, name) WHERE deleted_at IS NULL DO NOTHING
    RETURNING id INTO ch_term1;

    -- Fetch chapter IDs
    SELECT id INTO ch_term1 FROM chapters WHERE subject_id = subject_id AND name = 'Term 1: Letters A-M' AND deleted_at IS NULL;
    SELECT id INTO ch_term2 FROM chapters WHERE subject_id = subject_id AND name = 'Term 2: Letters N-Z' AND deleted_at IS NULL;
    SELECT id INTO ch_term3 FROM chapters WHERE subject_id = subject_id AND name = 'Term 3: Small Letters & Phonics' AND deleted_at IS NULL;
    SELECT id INTO ch_rhymes FROM chapters WHERE subject_id = subject_id AND name = 'Rhymes & Songs' AND deleted_at IS NULL;
    SELECT id INTO ch_stories FROM chapters WHERE subject_id = subject_id AND name = 'Story Time' AND deleted_at IS NULL;

    -- ─── TERM 1 LESSONS: Letters A-M ───
    INSERT INTO lessons (chapter_id, title, description, sort_order, status_id)
    VALUES
        (ch_term1, 'Letter A - Apple', 'Recognition and sound of letter A. Tracing, picture cards, and songs.', 1, active_status_id),
        (ch_term1, 'Letter B - Ball', 'Recognition and sound of letter B. Tracing, matching, and songs.', 2, active_status_id),
        (ch_term1, 'Letter C - Cat', 'Recognition and sound of letter C. Tracing, picture cards, and oral practice.', 3, active_status_id),
        (ch_term1, 'Letter D - Dog', 'Recognition and sound of letter D. Tracing, matching, and songs.', 4, active_status_id),
        (ch_term1, 'Letter E - Elephant', 'Recognition and sound of letter E. Tracing, picture cards, and oral practice.', 5, active_status_id),
        (ch_term1, 'Letter F - Fish', 'Recognition and sound of letter F. Tracing, matching, and songs.', 6, active_status_id),
        (ch_term1, 'Letter G - Grapes', 'Recognition and sound of letter G. Tracing, picture cards, and oral practice.', 7, active_status_id),
        (ch_term1, 'Letter H - Hat', 'Recognition and sound of letter H. Tracing, matching, and songs.', 8, active_status_id),
        (ch_term1, 'Letter I - Ice cream', 'Recognition and sound of letter I. Tracing, picture cards, and oral practice.', 9, active_status_id),
        (ch_term1, 'Letter J - Jug', 'Recognition and sound of letter J. Tracing, matching, and songs.', 10, active_status_id),
        (ch_term1, 'Letter K - Kite', 'Recognition and sound of letter K. Tracing, picture cards, and oral practice.', 11, active_status_id),
        (ch_term1, 'Letter L - Lion', 'Recognition and sound of letter L. Tracing, matching, and songs.', 12, active_status_id),
        (ch_term1, 'Letter M - Mango', 'Recognition and sound of letter M. Tracing, picture cards, and oral practice.', 13, active_status_id)
    ON CONFLICT (chapter_id, title) WHERE deleted_at IS NULL DO NOTHING;

    -- ─── TERM 2 LESSONS: Letters N-Z ───
    INSERT INTO lessons (chapter_id, title, description, sort_order, status_id)
    VALUES
        (ch_term2, 'Letter N - Nest', 'Recognition and sound of letter N. Tracing, word building, and songs.', 1, active_status_id),
        (ch_term2, 'Letter O - Orange', 'Recognition and sound of letter O. Tracing, picture-word match, and oral practice.', 2, active_status_id),
        (ch_term2, 'Letter P - Parrot', 'Recognition and sound of letter P. Tracing, matching, and songs.', 3, active_status_id),
        (ch_term2, 'Letter Q - Queen', 'Recognition and sound of letter Q. Tracing, picture cards, and oral practice.', 4, active_status_id),
        (ch_term2, 'Letter R - Rabbit', 'Recognition and sound of letter R. Tracing, word building, and songs.', 5, active_status_id),
        (ch_term2, 'Letter S - Sun', 'Recognition and sound of letter S. Tracing, picture-word match, and oral practice.', 6, active_status_id),
        (ch_term2, 'Letter T - Tiger', 'Recognition and sound of letter T. Tracing, matching, and songs.', 7, active_status_id),
        (ch_term2, 'Letter U - Umbrella', 'Recognition and sound of letter U. Tracing, picture cards, and oral practice.', 8, active_status_id),
        (ch_term2, 'Letter V - Van', 'Recognition and sound of letter V. Tracing, word building, and songs.', 9, active_status_id),
        (ch_term2, 'Letter W - Watch', 'Recognition and sound of letter W. Tracing, picture-word match, and oral practice.', 10, active_status_id),
        (ch_term2, 'Letter X - Xylophone', 'Recognition and sound of letter X. Tracing, matching, and songs.', 11, active_status_id),
        (ch_term2, 'Letter Y - Yak', 'Recognition and sound of letter Y. Tracing, picture cards, and oral practice.', 12, active_status_id),
        (ch_term2, 'Letter Z - Zebra', 'Recognition and sound of letter Z. Tracing, word building, and songs.', 13, active_status_id),
        (ch_term2, 'Simple Words: Cat, Dog, Sun, Moon', 'Picture-word matching with simple CVC words. Word building activities.', 14, active_status_id)
    ON CONFLICT (chapter_id, title) WHERE deleted_at IS NULL DO NOTHING;

    -- ─── TERM 3 LESSONS: Small Letters & Phonics ───
    INSERT INTO lessons (chapter_id, title, description, sort_order, status_id)
    VALUES
        (ch_term3, 'Small Letters a-m', 'Tracing and writing small letters a to m. Practice notebook activities.', 1, active_status_id),
        (ch_term3, 'Small Letters n-z', 'Tracing and writing small letters n to z. Practice notebook activities.', 2, active_status_id),
        (ch_term3, 'Phonics: at, am, an', 'Blending sounds with 2-letter word families. Tap-select activities.', 3, active_status_id),
        (ch_term3, 'Phonics: it, in, ig', 'Blending sounds with 2-letter word families. Drag-drop matching.', 4, active_status_id),
        (ch_term3, 'Phonics: op, ot, og', 'Blending sounds with 2-letter word families. Tracing and oral practice.', 5, active_status_id),
        (ch_term3, 'Phonics: un, ut, ub', 'Blending sounds with 2-letter word families. Word building games.', 6, active_status_id),
        (ch_term3, 'My Name Writing', 'Practice writing own name. Tracing notebook activity.', 7, active_status_id),
        (ch_term3, 'CVC Words: cat, bat, hat', 'Reading and writing simple CVC words. Picture-word match.', 8, active_status_id),
        (ch_term3, 'CVC Words: dog, log, fog', 'Reading and writing simple CVC words. Tracing and oral practice.', 9, active_status_id),
        (ch_term3, 'CVC Words: sun, run, fun', 'Reading and writing simple CVC words. Drag-drop activities.', 10, active_status_id)
    ON CONFLICT (chapter_id, title) WHERE deleted_at IS NULL DO NOTHING;

    -- ─── RHYMES ───
    INSERT INTO lessons (chapter_id, title, description, sort_order, status_id)
    VALUES
        (ch_rhymes, 'Twinkle Twinkle Little Star', 'Action songs and recitation. Star-themed craft activity.', 1, active_status_id),
        (ch_rhymes, 'Johnny Johnny Yes Papa', 'Action songs and role play. Sugar-themed craft activity.', 2, active_status_id),
        (ch_rhymes, 'Rain Rain Go Away', 'Seasonal connection with actions. Umbrella craft activity.', 3, active_status_id),
        (ch_rhymes, 'Baa Baa Black Sheep', 'Action songs and wool craft activity. Counting wool bags.', 4, active_status_id),
        (ch_rhymes, 'Humpty Dumpty', 'Action and coordination exercises. Egg-themed craft.', 5, active_status_id),
        (ch_rhymes, 'Jack and Jill', 'Action and coordination. Water bucket balance activity.', 6, active_status_id)
    ON CONFLICT (chapter_id, title) WHERE deleted_at IS NULL DO NOTHING;

    -- ─── STORY TIME ───
    INSERT INTO lessons (chapter_id, title, description, sort_order, status_id)
    VALUES
        (ch_stories, 'The Lion and the Mouse', 'Picture talk and moral discussion. Kindness craft activity.', 1, active_status_id),
        (ch_stories, 'The Thirsty Crow', 'Picture talk and sequencing. Water drop counting activity.', 2, active_status_id),
        (ch_stories, 'The Hare and the Tortoise', 'Sequencing and role play. Slow-and-steady craft.', 3, active_status_id),
        (ch_stories, 'The Ugly Duckling', 'Sequencing and role play. Swan transformation craft.', 4, active_status_id),
        (ch_stories, 'The Gingerbread Man', 'Prediction and ending change. Cookie craft activity.', 5, active_status_id),
        (ch_stories, 'Little Red Riding Hood', 'Prediction and ending change. Basket craft activity.', 6, active_status_id)
    ON CONFLICT (chapter_id, title) WHERE deleted_at IS NULL DO NOTHING;

    RAISE NOTICE 'LKG English curriculum seeded successfully!';
END $$;
