-- ═══════════════════════════════════════════════════════════════════════════════
-- LKG GK — CHAPTERS 3 TO 6 (INCREMENTAL, skips if already exists)
-- ═══════════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
    active_id    INT := (SELECT id FROM lookup_entity_status WHERE code = 'active');
    easy_id      INT := (SELECT id FROM lookup_difficulty_levels WHERE code = 'easy');
    mcq_id       INT := (SELECT id FROM lookup_question_types WHERE code = 'mcq_single');
    tap_id       INT := (SELECT id FROM lookup_activity_types WHERE code = 'tap_select');
    match_id     INT := (SELECT id FROM lookup_activity_types WHERE code = 'match');

    subj_id      UUID;

    ch_animals   UUID;
    ch_places    UUID;
    ch_safety    UUID;
    ch_fun       UUID;
    l_animal_names  UUID; l_birds_insects    UUID;
    l_places        UUID; l_helpers          UUID;
    l_road_safety   UUID; l_manners          UUID;
    l_sky_objects   UUID; l_festivals        UUID;

    act_id UUID; quiz_id UUID; q_id UUID;
BEGIN

    subj_id := (SELECT s.id FROM subjects s JOIN grades g ON s.grade_id = g.id WHERE g.code = 'lkg' AND s.code = 'gk');
    IF subj_id IS NULL THEN
        RAISE EXCEPTION 'GK subject not found — run lkg_gk_seed.sql first';
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 3: Animal World
    -- ═══════════════════════════════════════════════════════════════════════════
    ch_animals := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'Animal World' AND deleted_at IS NULL);
    IF ch_animals IS NULL THEN
        ch_animals := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
        VALUES (ch_animals, subj_id, 'Animal World', 3, active_id);
    END IF;

    -- Lesson 3.1: Animal Names
    l_animal_names := (SELECT id FROM lessons WHERE chapter_id = ch_animals AND title = 'Animal Names' AND deleted_at IS NULL);
    IF l_animal_names IS NULL THEN
        l_animal_names := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_animal_names, ch_animals, 'Animal Names', 'Learn dog, cat, elephant, and lion', '', '', 120, 1, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_animal_names, 'Name the Animal', tap_id, '{"prompt":"Which animal is BIG and has a trunk?","options":[{"id":"dog","label":"Dog"},{"id":"cat","label":"Cat"},{"id":"elephant","label":"Elephant"}],"correct_id":"elephant"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_animal_names, 'Animal Names Quiz', 'Name the animals!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'Which animal says BOW WOW?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Dog', true, 1), (q_id, 'Cat', false, 2), (q_id, 'Lion', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'Which animal is the KING of the jungle?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Elephant', false, 1), (q_id, 'Lion', true, 2), (q_id, 'Dog', false, 3);
    END IF;

    -- Lesson 3.2: Birds & Insects
    l_birds_insects := (SELECT id FROM lessons WHERE chapter_id = ch_animals AND title = 'Birds & Insects' AND deleted_at IS NULL);
    IF l_birds_insects IS NULL THEN
        l_birds_insects := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_birds_insects, ch_animals, 'Birds & Insects', 'Learn about birds, butterflies, and bees', '', '', 120, 2, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_birds_insects, 'Who Can Fly?', tap_id, '{"prompt":"Which one can FLY?","options":[{"id":"bird","label":"Bird"},{"id":"dog","label":"Dog"},{"id":"cat","label":"Cat"}],"correct_id":"bird"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_birds_insects, 'Birds & Insects Quiz', 'Who flies and who buzzes?', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'Which animal has wings and flies?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Dog', false, 1), (q_id, 'Bird', true, 2), (q_id, 'Fish', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'Which insect makes honey?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Butterfly', false, 1), (q_id, 'Bee', true, 2), (q_id, 'Ant', false, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 4: Around The World
    -- ═══════════════════════════════════════════════════════════════════════════
    ch_places := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'Around The World' AND deleted_at IS NULL);
    IF ch_places IS NULL THEN
        ch_places := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
        VALUES (ch_places, subj_id, 'Around The World', 4, active_id);
    END IF;

    -- Lesson 4.1: Places
    l_places := (SELECT id FROM lessons WHERE chapter_id = ch_places AND title = 'Places' AND deleted_at IS NULL);
    IF l_places IS NULL THEN
        l_places := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_places, ch_places, 'Places', 'Learn about home, school, hospital, and shop', '', '', 120, 1, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_places, 'Where Do We Study?', tap_id, '{"prompt":"Where do we go to study?","options":[{"id":"home","label":"Home"},{"id":"school","label":"School"},{"id":"shop","label":"Shop"}],"correct_id":"school"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_places, 'Places Quiz', 'Where do things happen?', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'Where do you live with your family?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Home', true, 1), (q_id, 'School', false, 2), (q_id, 'Hospital', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'Where do sick people go to get better?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'School', false, 1), (q_id, 'Shop', false, 2), (q_id, 'Hospital', true, 3);
    END IF;

    -- Lesson 4.2: Community Helpers
    l_helpers := (SELECT id FROM lessons WHERE chapter_id = ch_places AND title = 'Community Helpers' AND deleted_at IS NULL);
    IF l_helpers IS NULL THEN
        l_helpers := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_helpers, ch_places, 'Community Helpers', 'Learn about police, doctor, teacher, and firefighter', '', '', 120, 2, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_helpers, 'Who Helps Us?', tap_id, '{"prompt":"Who treats sick people?","options":[{"id":"teacher","label":"Teacher"},{"id":"doctor","label":"Doctor"},{"id":"police","label":"Police"}],"correct_id":"doctor"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_helpers, 'Community Helpers Quiz', 'Who helps us?', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'Who teaches you at school?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Doctor', false, 1), (q_id, 'Teacher', true, 2), (q_id, 'Police', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'Who puts out fires?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Firefighter', true, 1), (q_id, 'Doctor', false, 2), (q_id, 'Teacher', false, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 5: Safety & Rules
    -- ═══════════════════════════════════════════════════════════════════════════
    ch_safety := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'Safety & Rules' AND deleted_at IS NULL);
    IF ch_safety IS NULL THEN
        ch_safety := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
        VALUES (ch_safety, subj_id, 'Safety & Rules', 5, active_id);
    END IF;

    -- Lesson 5.1: Road Safety
    l_road_safety := (SELECT id FROM lessons WHERE chapter_id = ch_safety AND title = 'Road Safety' AND deleted_at IS NULL);
    IF l_road_safety IS NULL THEN
        l_road_safety := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_road_safety, ch_safety, 'Road Safety', 'Learn red stop, yellow wait, green go', '', '', 120, 1, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_road_safety, 'Stop or Go?', tap_id, '{"prompt":"What does RED light mean?","options":[{"id":"stop","label":"Stop"},{"id":"go","label":"Go"},{"id":"run","label":"Run"}],"correct_id":"stop"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_road_safety, 'Road Safety Quiz', 'Stay safe on the road!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'What does RED light mean at a traffic signal?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Go', false, 1), (q_id, 'Stop', true, 2), (q_id, 'Run', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'What does GREEN light mean?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Stop', false, 1), (q_id, 'Go', true, 2), (q_id, 'Wait', false, 3);
    END IF;

    -- Lesson 5.2: Good Manners
    l_manners := (SELECT id FROM lessons WHERE chapter_id = ch_safety AND title = 'Good Manners' AND deleted_at IS NULL);
    IF l_manners IS NULL THEN
        l_manners := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_manners, ch_safety, 'Good Manners', 'Learn please, thank you, and sorry', '', '', 120, 2, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_manners, 'Say the Magic Word', tap_id, '{"prompt":"What do you say when someone gives you something?","options":[{"id":"please","label":"Please"},{"id":"sorry","label":"Sorry"},{"id":"thanks","label":"Thank You"}],"correct_id":"thanks"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_manners, 'Good Manners Quiz', 'Be polite and kind!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'What word do you say when you ask for something?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Please', true, 1), (q_id, 'Sorry', false, 2), (q_id, 'Thank You', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'What do you say when you hurt someone by mistake?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Please', false, 1), (q_id, 'Sorry', true, 2), (q_id, 'Thank You', false, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 6: Fun Knowledge
    -- ═══════════════════════════════════════════════════════════════════════════
    ch_fun := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'Fun Knowledge' AND deleted_at IS NULL);
    IF ch_fun IS NULL THEN
        ch_fun := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
        VALUES (ch_fun, subj_id, 'Fun Knowledge', 6, active_id);
    END IF;

    -- Lesson 6.1: Sky Objects
    l_sky_objects := (SELECT id FROM lessons WHERE chapter_id = ch_fun AND title = 'Sky Objects' AND deleted_at IS NULL);
    IF l_sky_objects IS NULL THEN
        l_sky_objects := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_sky_objects, ch_fun, 'Sky Objects', 'Learn about the sun, moon, and stars', '', '', 120, 1, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_sky_objects, 'What Is in the Sky?', tap_id, '{"prompt":"What shines in the sky at NIGHT?","options":[{"id":"sun","label":"Sun"},{"id":"moon","label":"Moon"},{"id":"cloud","label":"Cloud"}],"correct_id":"moon"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_sky_objects, 'Sky Objects Quiz', 'What is up in the sky?', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'What shines in the sky during the DAY?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Moon', false, 1), (q_id, 'Sun', true, 2), (q_id, 'Stars', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'What shines in the sky at NIGHT?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Sun', false, 1), (q_id, 'Rainbow', false, 2), (q_id, 'Moon and Stars', true, 3);
    END IF;

    -- Lesson 6.2: Festivals
    l_festivals := (SELECT id FROM lessons WHERE chapter_id = ch_fun AND title = 'Festivals' AND deleted_at IS NULL);
    IF l_festivals IS NULL THEN
        l_festivals := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_festivals, ch_fun, 'Festivals', 'Learn about birthday, Christmas, and Diwali', '', '', 120, 2, active_id);

        act_id := gen_random_uuid();
        INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
        VALUES (act_id, l_festivals, 'Which Festival?', tap_id, '{"prompt":"Which festival has a Christmas tree?","options":[{"id":"birthday","label":"Birthday"},{"id":"christmas","label":"Christmas"},{"id":"diwali","label":"Diwali"}],"correct_id":"christmas"}', 1, active_id);

        quiz_id := gen_random_uuid();
        INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
        VALUES (quiz_id, l_festivals, 'Festivals Quiz', 'Celebrations around us!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'Which festival do we light diyas?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Christmas', false, 1), (q_id, 'Diwali', true, 2), (q_id, 'Birthday', false, 3);
        q_id := gen_random_uuid();
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
        VALUES (q_id, quiz_id, 'Which festival do we cut a cake?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Birthday', true, 1), (q_id, 'Diwali', false, 2), (q_id, 'Christmas', false, 3);
    END IF;

END $$;
