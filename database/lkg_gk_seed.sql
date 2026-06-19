-- ═══════════════════════════════════════════════════════════════════════════════
-- LKG GENERAL KNOWLEDGE (GK) — COMPLETE SEED DATA
-- 6 Chapters, 12 Lessons — "Little Genius World" curriculum
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run after: lkg_evs_seed.sql (needs lookup IDs and LKG grade to exist)
-- Usage: psql -U postgres -d yourdb -f lkg_gk_seed.sql
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    active_id    INT := (SELECT id FROM lookup_entity_status WHERE code = 'active');
    easy_id      INT := (SELECT id FROM lookup_difficulty_levels WHERE code = 'easy');
    mcq_id       INT := (SELECT id FROM lookup_question_types WHERE code = 'mcq_single');
    tap_id       INT := (SELECT id FROM lookup_activity_types WHERE code = 'tap_select');
    match_id     INT := (SELECT id FROM lookup_activity_types WHERE code = 'match');

    subj_id      UUID;

    -- chapter UUIDs
    ch_myself    UUID := gen_random_uuid();
    ch_colors    UUID := gen_random_uuid();
    ch_animals   UUID := gen_random_uuid();
    ch_places    UUID := gen_random_uuid();
    ch_safety    UUID := gen_random_uuid();
    ch_fun       UUID := gen_random_uuid();
    -- lesson UUIDs
    l_name_id       UUID; l_daily_routine    UUID;
    l_basic_colors  UUID; l_color_match      UUID;
    l_animal_names  UUID; l_birds_insects    UUID;
    l_places        UUID; l_helpers          UUID;
    l_road_safety   UUID; l_manners          UUID;
    l_sky_objects   UUID; l_festivals        UUID;

    act_id UUID; quiz_id UUID; q_id UUID;
BEGIN

    -- Ensure LKG GK subject exists
    subj_id := (SELECT s.id FROM subjects s JOIN grades g ON s.grade_id = g.id WHERE g.code = 'lkg' AND s.code = 'gk');
    IF subj_id IS NULL THEN
        subj_id := gen_random_uuid();
        INSERT INTO subjects (id, grade_id, name, code, description, sort_order, status_id)
        VALUES (subj_id, (SELECT id FROM grades WHERE code = 'lkg'), 'GK — Little Genius World', 'gk', 'General Knowledge for LKG: Myself, Colors, Animals, Places, Safety, Fun World', 2, active_id);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 1: Myself & My World
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_myself, subj_id, 'Myself & My World', 1, active_id);

    -- Lesson 1.1: My Name & Identity
    l_name_id := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_name_id, ch_myself, 'My Name & Identity', 'Learn your name, age, boy/girl, and school', '', '', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_name_id, 'Who Am I?', tap_id, '{"prompt":"What is something special about you?","options":[{"id":"name","label":"My Name"},{"id":"age","label":"My Age"},{"id":"school","label":"My School"}],"correct_id":"name"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_name_id, 'My Name & Identity Quiz', 'Tell me about yourself!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'What is your first name?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Your name starts with a letter', true, 1), (q_id, 'Your pet name', false, 2), (q_id, 'Your favorite food', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How old are you?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '3 or 4 years old', true, 1), (q_id, '10 years old', false, 2), (q_id, '1 year old', false, 3);

    -- Lesson 1.2: My Daily Routine
    l_daily_routine := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_daily_routine, ch_myself, 'My Daily Routine', 'Learn about morning, afternoon, and night activities', '', '', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_daily_routine, 'When Do We Sleep?', tap_id, '{"prompt":"When do we sleep?","options":[{"id":"morning","label":"Morning"},{"id":"afternoon","label":"Afternoon"},{"id":"night","label":"Night"}],"correct_id":"night"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_daily_routine, 'Daily Routine Quiz', 'Your daily activities!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'When do we wake up?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Morning', true, 1), (q_id, 'Night', false, 2), (q_id, 'Afternoon', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'When do we sleep?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Morning', false, 1), (q_id, 'Night', true, 2), (q_id, 'Noon', false, 3);

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 2: Colors Around Us
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_colors, subj_id, 'Colors Around Us', 2, active_id);

    -- Lesson 2.1: Basic Colors
    l_basic_colors := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_basic_colors, ch_colors, 'Basic Colors', 'Learn red, blue, yellow, and green colors', '', '', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_basic_colors, 'Find the Color', tap_id, '{"prompt":"Which color is RED?","options":[{"id":"red","label":"Red"},{"id":"blue","label":"Blue"},{"id":"yellow","label":"Yellow"}],"correct_id":"red"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_basic_colors, 'Basic Colors Quiz', 'Name the colors!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'What color is the sky?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Blue', true, 1), (q_id, 'Red', false, 2), (q_id, 'Yellow', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'What color is grass?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Blue', false, 1), (q_id, 'Green', true, 2), (q_id, 'Yellow', false, 3);

    -- Lesson 2.2: Color Match
    l_color_match := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_color_match, ch_colors, 'Color Match', 'Match objects to their colors: banana-yellow, leaf-green', '', '', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_color_match, 'Match the Color', match_id, '{"pairs":[{"object":"Banana","color":"Yellow"},{"object":"Apple","color":"Red"},{"object":"Leaf","color":"Green"},{"object":"Water","color":"Blue"}]}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_color_match, 'Color Match Quiz', 'What color is it?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'A banana is which color?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Red', false, 1), (q_id, 'Yellow', true, 2), (q_id, 'Blue', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'A leaf is which color?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Green', true, 1), (q_id, 'Red', false, 2), (q_id, 'Yellow', false, 3);

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 3: Animal World
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_animals, subj_id, 'Animal World', 3, active_id);

    -- Lesson 3.1: Animal Names
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

    -- Lesson 3.2: Birds & Insects
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

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 4: Around The World
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_places, subj_id, 'Around The World', 4, active_id);

    -- Lesson 4.1: Places
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

    -- Lesson 4.2: Community Helpers
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

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 5: Safety & Rules
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_safety, subj_id, 'Safety & Rules', 5, active_id);

    -- Lesson 5.1: Road Safety
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

    -- Lesson 5.2: Good Manners
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

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 6: Fun Knowledge
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_fun, subj_id, 'Fun Knowledge', 6, active_id);

    -- Lesson 6.1: Sky Objects
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

    -- Lesson 6.2: Festivals
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

END $$;
