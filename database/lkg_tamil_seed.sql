-- ═══════════════════════════════════════════════════════════════════════════════
-- LKG TAMIL — COMPLETE SEED DATA
-- Chapters → Lessons → Activities → Quizzes → Questions → Options
-- Fully idempotent — safe to run multiple times
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    active_id    INT := (SELECT id FROM lookup_entity_status WHERE code = 'active');
    easy_id      INT := (SELECT id FROM lookup_difficulty_levels WHERE code = 'easy');
    medium_id    INT := (SELECT id FROM lookup_difficulty_levels WHERE code = 'medium');
    mcq_id       INT := (SELECT id FROM lookup_question_types WHERE code = 'mcq_single');
    image_sel_id INT := (SELECT id FROM lookup_question_types WHERE code = 'image_select');
    tracing_id   INT := (SELECT id FROM lookup_activity_types WHERE code = 'tracing');
    drag_drop_id INT := (SELECT id FROM lookup_activity_types WHERE code = 'drag_drop');
    match_id     INT := (SELECT id FROM lookup_activity_types WHERE code = 'match');
    tap_id       INT := (SELECT id FROM lookup_activity_types WHERE code = 'tap_select');

    subj_id      UUID := (SELECT s.id FROM subjects s JOIN grades g ON s.grade_id = g.id WHERE g.code = 'lkg' AND s.code = 'tamil');

    next_order   INT := (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM chapters WHERE subject_id = subj_id AND deleted_at IS NULL);

    ch_id UUID; l_id UUID; act_id UUID; quiz_id UUID; q_id UUID;
    existing_id UUID;
BEGIN

    -- ═══════════════════════════════════════════════════════════════════════════
    -- HELPER: Create/get chapter
    -- ═══════════════════════════════════════════════════════════════════════════

    -- CHAPTER 1: Pre-Writing Strokes (முன் எழுத்து பயிற்சிகள்)
    existing_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'முன் எழுத்து பயிற்சிகள்' AND deleted_at IS NULL LIMIT 1);
    IF existing_id IS NULL THEN ch_id := gen_random_uuid(); INSERT INTO chapters (id, subject_id, name, sort_order, status_id) VALUES (ch_id, subj_id, 'முன் எழுத்து பயிற்சிகள்', next_order, active_id); ELSE ch_id := existing_id; END IF; next_order := next_order + 1;

    -- Lesson 1.1: Standing & Sleeping Lines
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_id AND title = 'நேர்வரை கோடுகள்' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_id, 'நேர்வரை கோடுகள்', 'Standing மற்றும் Sleeping கோடுகளை வரைய பழகுதல்', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'நேர்வரை Tracing', tracing_id, '{"shapes":["standing","sleeping"],"color":"#6366F1","thickness":4}', 1, active_id);
    END IF;

    -- Lesson 1.2: Slanting & Curved Lines
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_id AND title = 'சாய்வு மற்றும் வளைவு கோடுகள்' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_id, 'சாய்வு மற்றும் வளைவு கோடுகள்', 'Slanting மற்றும் Curved கோடுகளை வரைய பழகுதல்', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'சாய்வு Tracing', tracing_id, '{"shapes":["left-slanting","right-slanting","left-curve","right-curve"],"color":"#22C55E","thickness":4}', 1, active_id);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 2: உயிர் எழுத்துக்கள் அ-ஊ
    existing_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'உயிர் எழுத்துக்கள் அ-ஊ' AND deleted_at IS NULL LIMIT 1);
    IF existing_id IS NULL THEN ch_id := gen_random_uuid(); INSERT INTO chapters (id, subject_id, name, sort_order, status_id) VALUES (ch_id, subj_id, 'உயிர் எழுத்துக்கள் அ-ஊ', next_order, active_id); ELSE ch_id := existing_id; END IF; next_order := next_order + 1;

    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_id AND title = 'அ ஆ இ ஈ உ ஊ' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_id, 'அ ஆ இ ஈ உ ஊ', 'உயிர் எழுத்துக்கள் அ, ஆ, இ, ஈ, உ, ஊ ஆகியவற்றை அறிதல்', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'உயிர் எழுத்துக்களை Trace', tracing_id, '{"letters":["அ","ஆ","இ","ஈ","உ","ஊ"],"color":"#FF6B35","thickness":3}', 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'எழுத்தைத் தேர்ந்தெடு', tap_id, '{"prompt":"Tap the letter அ","options":[{"id":"அ","label":"அ"},{"id":"ஆ","label":"ஆ"},{"id":"இ","label":"இ"},{"id":"உ","label":"உ"}],"correct_id":"அ"}', 2, active_id);

        quiz_id := gen_random_uuid(); INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id) VALUES (quiz_id, l_id, 'உயிர் எழுத்துக்கள் 1 வினா', 'அ ஆ இ ஈ உ ஊ', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'தமிழின் முதல் எழுத்து எது?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'அ', true, 1), (q_id, 'ஆ', false, 2), (q_id, 'இ', false, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 3: உயிர் எழுத்துக்கள் எ-ஔ
    existing_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'உயிர் எழுத்துக்கள் எ-ஔ' AND deleted_at IS NULL LIMIT 1);
    IF existing_id IS NULL THEN ch_id := gen_random_uuid(); INSERT INTO chapters (id, subject_id, name, sort_order, status_id) VALUES (ch_id, subj_id, 'உயிர் எழுத்துக்கள் எ-ஔ', next_order, active_id); ELSE ch_id := existing_id; END IF; next_order := next_order + 1;

    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_id AND title = 'எ ஏ ஐ ஒ ஓ ஔ' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_id, 'எ ஏ ஐ ஒ ஓ ஔ', 'உயிர் எழுத்துக்கள் எ, ஏ, ஐ, ஒ, ஓ, ஔ ஆகியவற்றை அறிதல்', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Trace Vowels 2', tracing_id, '{"letters":["எ","ஏ","ஐ","ஒ","ஓ","ஔ"],"color":"#22C55E","thickness":3}', 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'எழுத்தைத் தேர்ந்தெடு 2', tap_id, '{"prompt":"Tap the letter எ","options":[{"id":"எ","label":"எ"},{"id":"ஏ","label":"ஏ"},{"id":"ஐ","label":"ஐ"},{"id":"ஒ","label":"ஒ"}],"correct_id":"எ"}', 2, active_id);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 4: மெய் எழுத்துக்கள் வரிசை 1
    existing_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'மெய் எழுத்துக்கள் - வரிசை 1' AND deleted_at IS NULL LIMIT 1);
    IF existing_id IS NULL THEN ch_id := gen_random_uuid(); INSERT INTO chapters (id, subject_id, name, sort_order, status_id) VALUES (ch_id, subj_id, 'மெய் எழுத்துக்கள் - வரிசை 1', next_order, active_id); ELSE ch_id := existing_id; END IF; next_order := next_order + 1;

    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_id AND title = 'க் ங் ச் ஞ்' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_id, 'க் ங் ச் ஞ்', 'மெய் எழுத்துக்கள் க், ங், ச், ஞ் ஆகியவற்றை அறிதல்', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'மெய் Match', match_id, '{"pairs":[{"letter":"க்","word":"கமலா"},{"letter":"ங்","word":"ங்"},{"letter":"ச்","word":"சட்டை"},{"letter":"ஞ்","word":"ஞாழல்"}]}', 1, active_id);
    END IF;

    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_id AND title = 'ட் ண் த் ந்' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_id, 'ட் ண் த் ந்', 'மெய் எழுத்துக்கள் ட், ண், த், ந் ஆகியவற்றை அறிதல்', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'ட ந Find', tap_id, '{"prompt":"Tap the letter ட்","options":[{"id":"ட்","label":"ட்"},{"id":"ண்","label":"ண்"},{"id":"த்","label":"த்"},{"id":"ந்","label":"ந்"}],"correct_id":"ட்"}', 1, active_id);
    END IF;

    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_id AND title = 'ப் ம்' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_id, 'ப் ம்', 'மெய் எழுத்துக்கள் ப், ம் ஆகியவற்றை அறிதல்', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 3, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'ப் ம் Match', match_id, '{"pairs":[{"letter":"ப்","word":"பறவை"},{"letter":"ம்","word":"மரம்"}]}', 1, active_id);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 5: மெய் எழுத்துக்கள் வரிசை 2
    existing_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'மெய் எழுத்துக்கள் - வரிசை 2' AND deleted_at IS NULL LIMIT 1);
    IF existing_id IS NULL THEN ch_id := gen_random_uuid(); INSERT INTO chapters (id, subject_id, name, sort_order, status_id) VALUES (ch_id, subj_id, 'மெய் எழுத்துக்கள் - வரிசை 2', next_order, active_id); ELSE ch_id := existing_id; END IF; next_order := next_order + 1;

    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_id AND title = 'ய் ர் ல் வ்' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_id, 'ய் ர் ல் வ்', 'மெய் எழுத்துக்கள் ய், ர், ல், வ் ஆகியவற்றை அறிதல்', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'ய் வ் Match', match_id, '{"pairs":[{"letter":"ய்","word":"யானை"},{"letter":"ர்","word":"ரோஜா"},{"letter":"ல்","word":"லட்சுமி"},{"letter":"வ்","word":"வண்டு"}]}', 1, active_id);
    END IF;

    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_id AND title = 'ழ் ள் ற் ன்' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_id, 'ழ் ள் ற் ன்', 'மெய் எழுத்துக்கள் ழ், ள், ற், ன் ஆகியவற்றை அறிதல்', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'ழ் ன் Find', tap_id, '{"prompt":"Tap the letter ழ்","options":[{"id":"ழ்","label":"ழ்"},{"id":"ள்","label":"ள்"},{"id":"ற்","label":"ற்"},{"id":"ன்","label":"ன்"}],"correct_id":"ழ்"}', 1, active_id);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 6: Simple Words (எளிய சொற்கள்)
    existing_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'எளிய சொற்கள்' AND deleted_at IS NULL LIMIT 1);
    IF existing_id IS NULL THEN ch_id := gen_random_uuid(); INSERT INTO chapters (id, subject_id, name, sort_order, status_id) VALUES (ch_id, subj_id, 'எளிய சொற்கள்', next_order, active_id); ELSE ch_id := existing_id; END IF; next_order := next_order + 1;

    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_id AND title = 'அம்மா அப்பா ஆடு ஊர்' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_id, 'அம்மா அப்பா ஆடு ஊர்', 'எளிய தமிழ் சொற்களைப் படிக்க கற்றல்', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'சொல் Match', match_id, '{"pairs":[{"word":"அம்மா","emoji":"👩"},{"word":"அப்பா","emoji":"👨"},{"word":"ஆடு","emoji":"🐐"},{"word":"ஊர்","emoji":"🏘️"}]}', 1, active_id);
    END IF;

    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_id AND title = 'எலி கடிகாரம்' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_id, 'எலி கடிகாரம்', 'எ, ஏ, ஒ, ஓ சொற்களைப் படிக்க கற்றல்', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'எலி Match', tap_id, '{"prompt":"எலியைத் தேர்ந்தெடு","options":[{"id":"எலி","label":"🐭 எலி"},{"id":"ஏணி","label":"🪜 ஏணி"},{"id":"ஒட்டகம்","label":"🐪 ஒட்டகம்"},{"id":"ஓடு","label":"🧱 ஓடு"}],"correct_id":"எலி"}', 1, active_id);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 7: பாடல்கள் மற்றும் கதைகள்
    existing_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'பாடல்கள் & கதைகள்' AND deleted_at IS NULL LIMIT 1);
    IF existing_id IS NULL THEN ch_id := gen_random_uuid(); INSERT INTO chapters (id, subject_id, name, sort_order, status_id) VALUES (ch_id, subj_id, 'பாடல்கள் & கதைகள்', next_order, active_id); ELSE ch_id := existing_id; END IF; next_order := next_order + 1;

    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_id AND title = 'ஒரு நாள் ஒரு முட்டை' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_id, 'ஒரு நாள் ஒரு முட்டை', 'பிரபலமான தமிழ் குழந்தை பாடல்', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 180, 1, active_id);
    END IF;

    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_id AND title = 'இரண்டு குஞ்சுகள்' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_id, 'இரண்டு குஞ்சுகள்', 'தமிழ் குழந்தை பாட்டு - குஞ்சுகள் பற்றி', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 180, 2, active_id);
    END IF;

END $$;
