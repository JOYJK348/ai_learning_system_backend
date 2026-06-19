-- ═══════════════════════════════════════════════════════════════════════════════
-- LKG HINDI — COMPLETE SEED DATA
-- 7 Chapters covering pre-writing, swar, vyanjan, words, speaking, rhymes, pictures
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    active_id INT := (SELECT id FROM lookup_entity_status WHERE code = 'active');
    easy_id   INT := (SELECT id FROM lookup_difficulty_levels WHERE code = 'easy');
    mcq_id    INT := (SELECT id FROM lookup_question_types WHERE code = 'mcq_single');
    tap_id    INT := (SELECT id FROM lookup_activity_types WHERE code = 'tap_select');
    match_id  INT := (SELECT id FROM lookup_activity_types WHERE code = 'match');

    subj_id UUID;

    ch_pre_writing  UUID; ch_swar      UUID; ch_vyanjan   UUID;
    ch_words        UUID; ch_speaking  UUID; ch_kavita    UUID;
    ch_pictures     UUID;

    l_standing UUID; l_curves UUID;
    l_aa       UUID; l_ii_uu  UUID;
    l_kaganga  UUID; l_chavarga UUID;
    l_ghar     UUID; l_phal_jal UUID;
    l_namaste  UUID; l_mammi_papa UUID;
    l_rhymes   UUID; l_moral_stories UUID;
    l_janwar   UUID; l_cheeze UUID;

    act_id UUID; quiz_id UUID; q_id UUID;
BEGIN

    subj_id := (SELECT s.id FROM subjects s JOIN grades g ON s.grade_id = g.id WHERE g.code = 'lkg' AND s.code = 'hindi');
    IF subj_id IS NULL THEN
        RAISE EXCEPTION 'Hindi subject not found — run final.sql first';
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 1: पूर्व लेखन अभ्यास (Pre-Writing)
    -- ═══════════════════════════════════════════════════════════════════════════
    ch_pre_writing := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'पूर्व लेखन अभ्यास' AND deleted_at IS NULL);
    IF ch_pre_writing IS NULL THEN
        ch_pre_writing := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
        VALUES (ch_pre_writing, subj_id, 'पूर्व लेखन अभ्यास', 1, active_id);
    END IF;

    -- Lesson 1.1: खड़ी और लेटी रेखा (Standing & Sleeping Lines)
    l_standing := (SELECT id FROM lessons WHERE chapter_id = ch_pre_writing AND title = 'खड़ी और लेटी रेखा' AND deleted_at IS NULL);
    IF l_standing IS NULL THEN
        l_standing := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_standing, ch_pre_writing, 'खड़ी और लेटी रेखा', 'Practice standing and sleeping lines', '', '', 120, 1, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_standing, 'Standing Line Practice', tap_id, '{"prompt":"Which line stands UP (खड़ी रेखा)?","options":[{"id":"standing","label":"खड़ी रेखा"},{"id":"sleeping","label":"लेटी रेखा"},{"id":"curve","label":"वक्र रेखा"}],"correct_id":"standing"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_standing, 'रेखा पहचान', 'Identify the lines!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'कौन सी रेखा सीधी खड़ी है? (Which line stands straight?)', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'खड़ी रेखा', true, 1), (q_id, 'लेटी रेखा', false, 2), (q_id, 'वक्र रेखा', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'कौन सी रेखा सोई हुई है? (Which line is sleeping?)', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'लेटी रेखा', true, 1), (q_id, 'खड़ी रेखा', false, 2), (q_id, 'तिरछी रेखा', false, 3);
    END IF;

    -- Lesson 1.2: वक्र और तिरछी रेखा (Curves & Slanting Lines)
    l_curves := (SELECT id FROM lessons WHERE chapter_id = ch_pre_writing AND title = 'वक्र और तिरछी रेखा' AND deleted_at IS NULL);
    IF l_curves IS NULL THEN
        l_curves := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_curves, ch_pre_writing, 'वक्र और तिरछी रेखा', 'Practice curves and slanting lines', '', '', 120, 2, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_curves, 'Curve Practice', tap_id, '{"prompt":"Which one is a CURVE (वक्र रेखा)?","options":[{"id":"curve","label":"वक्र रेखा"},{"id":"standing","label":"खड़ी रेखा"},{"id":"sleeping","label":"लेटी रेखा"}],"correct_id":"curve"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_curves, 'वक्र रेखा पहचान', 'Find the curves!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'गोल घूमने वाली रेखा कौन सी है? (Which line goes round and round?)', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'वक्र रेखा', true, 1), (q_id, 'सीधी रेखा', false, 2), (q_id, 'टेढ़ी रेखा', false, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 2: स्वर (Vowels)
    -- ═══════════════════════════════════════════════════════════════════════════
    ch_swar := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'स्वर' AND deleted_at IS NULL);
    IF ch_swar IS NULL THEN
        ch_swar := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
        VALUES (ch_swar, subj_id, 'स्वर', 2, active_id);
    END IF;

    -- Lesson 2.1: स्वर अ और आ
    l_aa := (SELECT id FROM lessons WHERE chapter_id = ch_swar AND title = 'अ और आ' AND deleted_at IS NULL);
    IF l_aa IS NULL THEN
        l_aa := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_aa, ch_swar, 'अ और आ', 'Learn vowels अ (anar) and आ (aam)', '', '', 120, 1, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_aa, 'अ से अनार', tap_id, '{"prompt":"Which word starts with अ?","options":[{"id":"anar","label":"अनार 🍎"},{"id":"aam","label":"आम 🥭"},{"id":"imli","label":"इमली 🍈"}],"correct_id":"anar"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_aa, 'अ और आ पहचान', 'Identify अ and आ words!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'अ से कौन सा शब्द शुरू होता है? (Which word starts with अ?)', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'अनार', true, 1), (q_id, 'आम', false, 2), (q_id, 'इमली', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'आ से कौन सा शब्द शुरू होता है? (Which word starts with आ?)', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'आम', true, 1), (q_id, 'अनार', false, 2), (q_id, 'उल्लू', false, 3);
    END IF;

    -- Lesson 2.2: स्वर इ से ऊ
    l_ii_uu := (SELECT id FROM lessons WHERE chapter_id = ch_swar AND title = 'इ से ऊ' AND deleted_at IS NULL);
    IF l_ii_uu IS NULL THEN
        l_ii_uu := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_ii_uu, ch_swar, 'इ से ऊ', 'Learn vowels इ, ई, उ, ऊ', '', '', 120, 2, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_ii_uu, 'इ से इमली', tap_id, '{"prompt":"Which word starts with इ?","options":[{"id":"imli","label":"इमली 🍈"},{"id":"eent","label":"ईंट 🧱"},{"id":"ullu","label":"उल्लू 🦉"}],"correct_id":"imli"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_ii_uu, 'इ से ऊ पहचान', 'More vowel words!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'उ से कौन सा शब्द शुरू होता है? (Which word starts with उ?)', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'उल्लू', true, 1), (q_id, 'ईंट', false, 2), (q_id, 'इमली', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'ऊ से कौन सा शब्द शुरू होता है? (Which word starts with ऊ?)', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'ऊँट', true, 1), (q_id, 'उल्लू', false, 2), (q_id, 'ईंट', false, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 3: व्यंजन (Consonants)
    -- ═══════════════════════════════════════════════════════════════════════════
    ch_vyanjan := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'व्यंजन' AND deleted_at IS NULL);
    IF ch_vyanjan IS NULL THEN
        ch_vyanjan := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
        VALUES (ch_vyanjan, subj_id, 'व्यंजन', 3, active_id);
    END IF;

    -- Lesson 3.1: क वर्ग (क ख ग घ)
    l_kaganga := (SELECT id FROM lessons WHERE chapter_id = ch_vyanjan AND title = 'क ख ग घ' AND deleted_at IS NULL);
    IF l_kaganga IS NULL THEN
        l_kaganga := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_kaganga, ch_vyanjan, 'क ख ग घ', 'Learn consonants क, ख, ग, घ', '', '', 120, 1, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_kaganga, 'क से कबूतर', tap_id, '{"prompt":"क से कौन सा शब्द शुरू होता है?","options":[{"id":"kabutar","label":"कबूतर 🕊️"},{"id":"khargosh","label":"खरगोश 🐇"},{"id":"ghar","label":"घर 🏠"}],"correct_id":"kabutar"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_kaganga, 'क वर्ग पहचान', 'Consonants identification!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'ख से कौन सा शब्द शुरू होता है?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'खरगोश', true, 1), (q_id, 'कबूतर', false, 2), (q_id, 'गाय', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'ग से कौन सा शब्द शुरू होता है?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'गाय', true, 1), (q_id, 'घर', false, 2), (q_id, 'खरगोश', false, 3);
    END IF;

    -- Lesson 3.2: च वर्ग (च छ ज)
    l_chavarga := (SELECT id FROM lessons WHERE chapter_id = ch_vyanjan AND title = 'च छ ज' AND deleted_at IS NULL);
    IF l_chavarga IS NULL THEN
        l_chavarga := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_chavarga, ch_vyanjan, 'च छ ज', 'Learn consonants च, छ, ज', '', '', 120, 2, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_chavarga, 'च से चिड़िया', tap_id, '{"prompt":"च से कौन सा शब्द शुरू होता है?","options":[{"id":"chidiya","label":"चिड़िया 🐦"},{"id":"chhata","label":"छाता 🌂"},{"id":"jahaz","label":"जहाज़ 🚢"}],"correct_id":"chidiya"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_chavarga, 'च वर्ग पहचान', 'More consonants!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'छ से कौन सा शब्द शुरू होता है?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'छाता', true, 1), (q_id, 'चिड़िया', false, 2), (q_id, 'जहाज़', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'ज से कौन सा शब्द शुरू होता है?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'जहाज़', true, 1), (q_id, 'चिड़िया', false, 2), (q_id, 'छाता', false, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 4: सरल शब्द (Simple Words)
    -- ═══════════════════════════════════════════════════════════════════════════
    ch_words := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'सरल शब्द' AND deleted_at IS NULL);
    IF ch_words IS NULL THEN
        ch_words := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
        VALUES (ch_words, subj_id, 'सरल शब्द', 4, active_id);
    END IF;

    -- Lesson 4.1: घर और फल
    l_ghar := (SELECT id FROM lessons WHERE chapter_id = ch_words AND title = 'घर और फल' AND deleted_at IS NULL);
    IF l_ghar IS NULL THEN
        l_ghar := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_ghar, ch_words, 'घर और फल', 'Learn simple words: ghar, phal', '', '', 120, 1, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_ghar, 'घर पहचान', tap_id, '{"prompt":"Which word means HOME?","options":[{"id":"ghar","label":"घर 🏠"},{"id":"phal","label":"फल 🍎"},{"id":"jal","label":"जल 💧"}],"correct_id":"ghar"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_ghar, 'सरल शब्द पहचान', 'Simple words quiz!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'Which word means FRUIT?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'फल', true, 1), (q_id, 'घर', false, 2), (q_id, 'जल', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'Which word means WATER?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'जल', true, 1), (q_id, 'वन', false, 2), (q_id, 'फल', false, 3);
    END IF;

    -- Lesson 4.2: जल और वन
    l_phal_jal := (SELECT id FROM lessons WHERE chapter_id = ch_words AND title = 'जल और वन' AND deleted_at IS NULL);
    IF l_phal_jal IS NULL THEN
        l_phal_jal := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_phal_jal, ch_words, 'जल और वन', 'Learn simple words: jal, van', '', '', 120, 2, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_phal_jal, 'जल पहचान', tap_id, '{"prompt":"Which word means FOREST?","options":[{"id":"van","label":"वन 🌲"},{"id":"ghar","label":"घर 🏠"},{"id":"jal","label":"जल 💧"}],"correct_id":"van"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_phal_jal, 'शब्द अभ्यास', 'More simple words!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'पीने का पानी कहलाता है — (Drinking water is called —)', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'जल', true, 1), (q_id, 'फल', false, 2), (q_id, 'वन', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'पेड़ों से भरा स्थान कहलाता है — (A place full of trees is called —)', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'वन', true, 1), (q_id, 'घर', false, 2), (q_id, 'जल', false, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 5: बोलना (Speaking)
    -- ═══════════════════════════════════════════════════════════════════════════
    ch_speaking := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'बोलना' AND deleted_at IS NULL);
    IF ch_speaking IS NULL THEN
        ch_speaking := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
        VALUES (ch_speaking, subj_id, 'बोलना', 5, active_id);
    END IF;

    -- Lesson 5.1: नमस्ते और परिचय
    l_namaste := (SELECT id FROM lessons WHERE chapter_id = ch_speaking AND title = 'नमस्ते और परिचय' AND deleted_at IS NULL);
    IF l_namaste IS NULL THEN
        l_namaste := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_namaste, ch_speaking, 'नमस्ते और परिचय', 'Learn basic greetings and introduction in Hindi', '', '', 120, 1, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_namaste, 'नमस्ते कहो', tap_id, '{"prompt":"How do you say HELLO in Hindi?","options":[{"id":"namaste","label":"नमस्ते 🙏"},{"id":"papa","label":"पापा 👨"},{"id":"mammi","label":"मम्मी 👩"}],"correct_id":"namaste"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_namaste, 'बोलना अभ्यास', 'Speaking practice!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'नमस्ते का क्या अर्थ है? (What does namaste mean?)', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Hello / Greetings', true, 1), (q_id, 'Goodbye', false, 2), (q_id, 'Thank you', false, 3);
    END IF;

    -- Lesson 5.2: मेरा परिवार
    l_mammi_papa := (SELECT id FROM lessons WHERE chapter_id = ch_speaking AND title = 'मेरा परिवार' AND deleted_at IS NULL);
    IF l_mammi_papa IS NULL THEN
        l_mammi_papa := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_mammi_papa, ch_speaking, 'मेरा परिवार', 'Learn family words in Hindi: mamma, papa', '', '', 120, 2, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_mammi_papa, 'परिवार पहचान', tap_id, '{"prompt":"मम्मी कौन हैं? (Who is MAMMI?)","options":[{"id":"mother","label":"मम्मी 👩"},{"id":"father","label":"पापा 👨"},{"id":"grandpa","label":"दादा 👴"}],"correct_id":"mother"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_mammi_papa, 'परिवार अभ्यास', 'Family words in Hindi!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'पापा कौन हैं? (Who is PAPA?)', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Father', true, 1), (q_id, 'Mother', false, 2), (q_id, 'Brother', false, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 6: कविताएँ और कहानियाँ (Rhymes & Stories)
    -- ═══════════════════════════════════════════════════════════════════════════
    ch_kavita := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'कविताएँ और कहानियाँ' AND deleted_at IS NULL);
    IF ch_kavita IS NULL THEN
        ch_kavita := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
        VALUES (ch_kavita, subj_id, 'कविताएँ और कहानियाँ', 6, active_id);
    END IF;

    -- Lesson 6.1: प्रिय कविताएँ
    l_rhymes := (SELECT id FROM lessons WHERE chapter_id = ch_kavita AND title = 'प्रिय कविताएँ' AND deleted_at IS NULL);
    IF l_rhymes IS NULL THEN
        l_rhymes := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_rhymes, ch_kavita, 'प्रिय कविताएँ', 'Popular Hindi rhymes', '', '', 120, 1, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_rhymes, 'कविता पहचान', tap_id, '{"prompt":"What do we call a RHYME in Hindi?","options":[{"id":"kavita","label":"कविता 🎵"},{"id":"kahani","label":"कहानी 📖"},{"id":"shabd","label":"शब्द 📝"}],"correct_id":"kavita"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_rhymes, 'कविता प्रश्न', 'Rhymes quiz!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'Hindi poem is also known as —', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'कविता', true, 1), (q_id, 'कहानी', false, 2), (q_id, 'गीत', false, 3);
    END IF;

    -- Lesson 6.2: छोटी कहानियाँ
    l_moral_stories := (SELECT id FROM lessons WHERE chapter_id = ch_kavita AND title = 'छोटी कहानियाँ' AND deleted_at IS NULL);
    IF l_moral_stories IS NULL THEN
        l_moral_stories := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_moral_stories, ch_kavita, 'छोटी कहानियाँ', 'Small moral stories for kids', '', '', 120, 2, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_moral_stories, 'कहानी पहचान', tap_id, '{"prompt":"What do we call a STORY in Hindi?","options":[{"id":"kahani","label":"कहानी 📖"},{"id":"kavita","label":"कविता 🎵"},{"id":"chitra","label":"चित्र 🖼️"}],"correct_id":"kahani"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_moral_stories, 'कहानी प्रश्न', 'Stories quiz!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'Which one do we READ and enjoy?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'कहानी (Story)', true, 1), (q_id, 'कविता (Poem)', false, 2), (q_id, 'चित्र (Picture)', false, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 7: चित्र पहचान (Picture Recognition)
    -- ═══════════════════════════════════════════════════════════════════════════
    ch_pictures := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'चित्र पहचान' AND deleted_at IS NULL);
    IF ch_pictures IS NULL THEN
        ch_pictures := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
        VALUES (ch_pictures, subj_id, 'चित्र पहचान', 7, active_id);
    END IF;

    -- Lesson 7.1: जानवर पहचान
    l_janwar := (SELECT id FROM lessons WHERE chapter_id = ch_pictures AND title = 'जानवर पहचान' AND deleted_at IS NULL);
    IF l_janwar IS NULL THEN
        l_janwar := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_janwar, ch_pictures, 'जानवर पहचान', 'Identify animals in Hindi: elephant, cat, etc.', '', '', 120, 1, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_janwar, 'हाथी पहचान', tap_id, '{"prompt":"यह कौन है? (Who is this?) 🐘","options":[{"id":"hathi","label":"हाथी"},{"id":"billi","label":"बिल्ली"},{"id":"kutta","label":"कुत्ता"}],"correct_id":"hathi"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_janwar, 'जानवर प्रश्न', 'Animal identification!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'बिल्ली को हिंदी में क्या कहते हैं? (What is a cat called in Hindi?)', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'बिल्ली', true, 1), (q_id, 'हाथी', false, 2), (q_id, 'कुत्ता', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'फूल को हिंदी में क्या कहते हैं? (What is a flower called in Hindi?)', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'फूल', true, 1), (q_id, 'पेड़', false, 2), (q_id, 'घर', false, 3);
    END IF;

    -- Lesson 7.2: आस-पास की चीज़ें
    l_cheeze := (SELECT id FROM lessons WHERE chapter_id = ch_pictures AND title = 'आस-पास की चीज़ें' AND deleted_at IS NULL);
    IF l_cheeze IS NULL THEN
        l_cheeze := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_cheeze, ch_pictures, 'आस-पास की चीज़ें', 'Identify everyday things in Hindi', '', '', 120, 2, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_cheeze, 'गाड़ी पहचान', tap_id, '{"prompt":"यह क्या है? (What is this?) 🚗","options":[{"id":"gadi","label":"गाड़ी"},{"id":"ghar","label":"घर"},{"id":"ped","label":"पेड़"}],"correct_id":"gadi"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_cheeze, 'चीज़ें पहचान', 'Things identification!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'पेड़ को हिंदी में क्या कहते हैं? (What is a tree called in Hindi?)', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'पेड़', true, 1), (q_id, 'फूल', false, 2), (q_id, 'घर', false, 3);
    END IF;

END $$;
