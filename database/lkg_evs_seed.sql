-- ═══════════════════════════════════════════════════════════════════════════════
-- LKG ENVIRONMENTAL STUDIES (EVS) — COMPLETE SEED DATA
-- 6 Chapters, 17 Lessons — "Little Explorer" curriculum
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

    subj_id      UUID := (SELECT s.id FROM subjects s JOIN grades g ON s.grade_id = g.id WHERE g.code = 'lkg' AND s.code = 'evs');

    -- chapter UUIDs
    ch_myself    UUID := gen_random_uuid();
    ch_family    UUID := gen_random_uuid();
    ch_animals   UUID := gen_random_uuid();
    ch_nature    UUID := gen_random_uuid();
    ch_transport UUID := gen_random_uuid();
    ch_habits    UUID := gen_random_uuid();
    -- lesson UUIDs
    l_body_parts     UUID; l_five_senses    UUID; l_take_care      UUID;
    l_family_members UUID; l_my_home        UUID;
    l_pet_wild       UUID; l_animal_homes   UUID;
    l_plant_parts    UUID; l_nature_things  UUID; l_seasons        UUID;
    l_land_transport UUID; l_air_water      UUID; l_traffic_rules  UUID;
    l_clean_habits   UUID; l_healthy_food   UUID; l_daily_routine  UUID;

    act_id UUID; quiz_id UUID; q_id UUID;
BEGIN

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 1: Myself
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_myself, subj_id, 'Myself', 1, active_id);

    -- Lesson 1.1: My Body Parts
    l_body_parts := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_body_parts, ch_myself, 'My Body Parts', 'Learn to identify different parts of the body', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_body_parts, 'Touch Your Body Part', tap_id, '{"prompt":"Touch your EYES!","options":[{"id":"eyes","label":"Eyes"},{"id":"ears","label":"Ears"},{"id":"nose","label":"Nose"}],"correct_id":"eyes"}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_body_parts, 'Match Body Parts', match_id, '{"pairs":[{"part":"Eyes","action":"See"},{"part":"Ears","action":"Hear"},{"part":"Hands","action":"Wave"},{"part":"Legs","action":"Run"}]}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_body_parts, 'My Body Quiz', 'Show what you know about your body!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which body part do you use to SEE?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Eyes', true, 1), (q_id, 'Ears', false, 2), (q_id, 'Nose', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which body part do you use to HEAR?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Nose', false, 1), (q_id, 'Ears', true, 2), (q_id, 'Eyes', false, 3);

    -- Lesson 1.2: My Five Senses
    l_five_senses := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_five_senses, ch_myself, 'My Five Senses', 'Learn about the five senses: see, hear, smell, taste, touch', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_five_senses, 'Which Sense?', tap_id, '{"prompt":"Which sense helps you see a rainbow?","options":[{"id":"sight","label":"Sight"},{"id":"hearing","label":"Hearing"},{"id":"smell","label":"Smell"}],"correct_id":"sight"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_five_senses, 'Five Senses Quiz', 'Test your five senses knowledge!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which sense helps you smell a flower?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Hearing', false, 1), (q_id, 'Smell', true, 2), (q_id, 'Touch', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which sense helps you taste ice cream?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Taste', true, 1), (q_id, 'Sight', false, 2), (q_id, 'Touch', false, 3);

    -- Lesson 1.3: Taking Care of My Body
    l_take_care := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_take_care, ch_myself, 'Taking Care of My Body', 'Learn basic hygiene: brushing, bathing, and sleeping', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_take_care, 'Good or Bad Habit?', tap_id, '{"prompt":"Brushing your teeth every day is...","options":[{"id":"good","label":"Good"},{"id":"bad","label":"Bad"}],"correct_id":"good"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_take_care, 'Taking Care Quiz', 'How do you take care of your body?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How many times should you brush your teeth?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Once a week', false, 1), (q_id, 'Twice a day', true, 2), (q_id, 'Never', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'What do you need for a bath?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Water and soap', true, 1), (q_id, 'Only water', false, 2), (q_id, 'Sand', false, 3);
    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 2: My Family
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_family, subj_id, 'My Family & Home', 2, active_id);

    -- Lesson 2.1: Family Members
    l_family_members := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_family_members, ch_family, 'Family Members', 'Learn about father, mother, brother, sister, and grandparents', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_family_members, 'Who Takes Care?', tap_id, '{"prompt":"Who cooks food for you at home?","options":[{"id":"mother","label":"Mother"},{"id":"brother","label":"Brother"},{"id":"teacher","label":"Teacher"}],"correct_id":"mother"}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_family_members, 'Match Family Members', match_id, '{"pairs":[{"name":"Mother","role":"Mummy"},{"name":"Father","role":"Daddy"},{"name":"Sister","role":"Sister"},{"name":"Brother","role":"Brother"}]}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_family_members, 'Family Quiz', 'Who is in your family?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Who is your mother?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Your teacher', false, 1), (q_id, 'The woman who gave birth to you', true, 2), (q_id, 'Your friend', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Who are your grandparents?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Your parents parents', true, 1), (q_id, 'Your brother and sister', false, 2), (q_id, 'Your neighbours', false, 3);

    -- Lesson 2.2: My Home
    l_my_home := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_my_home, ch_family, 'My Home', 'Learn about different rooms in a house', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_my_home, 'Where Do We Cook?', tap_id, '{"prompt":"Where do we cook food?","options":[{"id":"kitchen","label":"Kitchen"},{"id":"bedroom","label":"Bedroom"},{"id":"bathroom","label":"Bathroom"}],"correct_id":"kitchen"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_my_home, 'My Home Quiz', 'Where do things belong?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Where do you sleep?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Bedroom', true, 1), (q_id, 'Kitchen', false, 2), (q_id, 'Living Room', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Where do you take a bath?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Kitchen', false, 1), (q_id, 'Bathroom', true, 2), (q_id, 'Bedroom', false, 3);
    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 3: Animals Around Us
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_animals, subj_id, 'Animals Around Us', 3, active_id);

    -- Lesson 3.1: Pet & Wild Animals
    l_pet_wild := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_pet_wild, ch_animals, 'Pet & Wild Animals', 'Learn the difference between pet and wild animals', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_pet_wild, 'Pet or Wild?', tap_id, '{"prompt":"Which animal lives with humans?","options":[{"id":"dog","label":"Dog"},{"id":"lion","label":"Lion"},{"id":"tiger","label":"Tiger"}],"correct_id":"dog"}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_pet_wild, 'Sort Animals', drag_drop_id, '{"items":[{"id":"dog","label":"Dog"},{"id":"cat","label":"Cat"},{"id":"lion","label":"Lion"},{"id":"elephant","label":"Elephant"}],"targets":[{"id":"pets","label":"Pets"},{"id":"wild","label":"Wild"}]}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_pet_wild, 'Pet & Wild Quiz', 'Know your animals!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which animal is a PET?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Dog', true, 1), (q_id, 'Lion', false, 2), (q_id, 'Tiger', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which animal is WILD?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Cat', false, 1), (q_id, 'Elephant', true, 2), (q_id, 'Fish', false, 3);

    -- Lesson 3.2: Animal Homes (moved from sort 3 to sort 2)
    l_animal_homes := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_animal_homes, ch_animals, 'Animal Homes', 'Learn where different animals live', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_animal_homes, 'Where Does It Live?', tap_id, '{"prompt":"Where does a bird live?","options":[{"id":"nest","label":"Nest"},{"id":"water","label":"Water"},{"id":"cave","label":"Cave"}],"correct_id":"nest"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_animal_homes, 'Animal Homes Quiz', 'Where do animals live?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Where does a fish live?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Water', true, 1), (q_id, 'Nest', false, 2), (q_id, 'House', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Where does a rabbit live?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Nest', false, 1), (q_id, 'Burrow', true, 2), (q_id, 'Water', false, 3);
    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 4: Plants & Nature
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_nature, subj_id, 'Plants & Nature', 4, active_id);

    -- Lesson 4.1: Parts of a Plant
    l_plant_parts := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_plant_parts, ch_nature, 'Parts of a Plant', 'Learn about roots, stem, leaves, flowers, and fruits', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_plant_parts, 'Parts of a Plant', tap_id, '{"prompt":"Which part of the plant is underground?","options":[{"id":"root","label":"Root"},{"id":"stem","label":"Stem"},{"id":"leaf","label":"Leaf"}],"correct_id":"root"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_plant_parts, 'Parts of a Plant Quiz', 'What do you know about plants?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which part of the plant is UNDER the soil?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Root', true, 1), (q_id, 'Leaf', false, 2), (q_id, 'Flower', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which part of the plant is colorful and pretty?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Root', false, 1), (q_id, 'Flower', true, 2), (q_id, 'Stem', false, 3);

    -- Lesson 4.2: Things Around Nature
    l_nature_things := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_nature_things, ch_nature, 'Things Around Nature', 'Learn about sun, rain, clouds, and rainbow', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_nature_things, 'What Is It?', tap_id, '{"prompt":"What gives us light and heat in the sky?","options":[{"id":"sun","label":"Sun"},{"id":"moon","label":"Moon"},{"id":"cloud","label":"Cloud"}],"correct_id":"sun"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_nature_things, 'Nature Quiz', 'Things in nature around us!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'What shines in the sky during the day?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Moon', false, 1), (q_id, 'Sun', true, 2), (q_id, 'Stars', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'What appears after rain with many colors?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Cloud', false, 1), (q_id, 'Rainbow', true, 2), (q_id, 'Sun', false, 3);

    -- Lesson 4.3: Seasons
    l_seasons := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_seasons, ch_nature, 'Seasons', 'Learn about summer, rainy, and winter seasons', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_seasons, 'Which Season?', tap_id, '{"prompt":"Which season is HOT?","options":[{"id":"summer","label":"Summer"},{"id":"winter","label":"Winter"},{"id":"rainy","label":"Rainy"}],"correct_id":"summer"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_seasons, 'Seasons Quiz', 'How well do you know seasons?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which season is cold?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Summer', false, 1), (q_id, 'Winter', true, 2), (q_id, 'Rainy', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which season brings rain?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Summer', false, 1), (q_id, 'Winter', false, 2), (q_id, 'Rainy', true, 3);
    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 5: Transport
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_transport, subj_id, 'Transport', 5, active_id);

    -- Lesson 5.1: Land Transport
    l_land_transport := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_land_transport, ch_transport, 'Land Transport', 'Learn about vehicles that move on land', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_land_transport, 'What Moves on Land?', tap_id, '{"prompt":"Which one moves on LAND?","options":[{"id":"car","label":"Car"},{"id":"boat","label":"Boat"},{"id":"plane","label":"Plane"}],"correct_id":"car"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_land_transport, 'Land Transport Quiz', 'Know your vehicles!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which vehicle has two wheels and you pedal?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Car', false, 1), (q_id, 'Bicycle', true, 2), (q_id, 'Train', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which vehicle goes on tracks and says choo choo?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Bus', false, 1), (q_id, 'Train', true, 2), (q_id, 'Car', false, 3);

    -- Lesson 5.2: Air & Water Transport
    l_air_water := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_air_water, ch_transport, 'Air & Water Transport', 'Learn about vehicles that fly and float', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_air_water, 'Where Does It Travel?', tap_id, '{"prompt":"Where does an airplane travel?","options":[{"id":"sky","label":"Sky"},{"id":"land","label":"Land"},{"id":"water","label":"Water"}],"correct_id":"sky"}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_air_water, 'Sort Transport', drag_drop_id, '{"items":[{"id":"plane","label":"Airplane"},{"id":"ship","label":"Ship"},{"id":"helicopter","label":"Helicopter"},{"id":"boat","label":"Boat"}],"targets":[{"id":"air","label":"Air"},{"id":"water","label":"Water"}]}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_air_water, 'Air & Water Quiz', 'Where do they go?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which vehicle FLIES in the sky?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Ship', false, 1), (q_id, 'Airplane', true, 2), (q_id, 'Train', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which vehicle FLOATS on water?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Helicopter', false, 1), (q_id, 'Boat', true, 2), (q_id, 'Car', false, 3);

    -- Lesson 5.3: Traffic Rules
    l_traffic_rules := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_traffic_rules, ch_transport, 'Traffic Rules', 'Learn basic traffic rules: red light stop, green light go', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_traffic_rules, 'Stop or Go?', tap_id, '{"prompt":"What does RED light mean?","options":[{"id":"stop","label":"Stop"},{"id":"go","label":"Go"},{"id":"wait","label":"Wait"}],"correct_id":"stop"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_traffic_rules, 'Traffic Rules Quiz', 'Stay safe on the road!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'What does RED light mean?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Go', false, 1), (q_id, 'Stop', true, 2), (q_id, 'Run', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Where should you cross the road?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Anywhere', false, 1), (q_id, 'Zebra crossing', true, 2), (q_id, 'Middle of road', false, 3);
    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 6: Good Habits
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_habits, subj_id, 'Good Habits', 6, active_id);

    -- Lesson 6.1: Clean Habits
    l_clean_habits := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_clean_habits, ch_habits, 'Clean Habits', 'Learn about brushing teeth, washing hands, and keeping clean', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_clean_habits, 'What Should You Do?', tap_id, '{"prompt":"What should you do BEFORE eating?","options":[{"id":"wash","label":"Wash hands"},{"id":"sleep","label":"Sleep"},{"id":"run","label":"Run"}],"correct_id":"wash"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_clean_habits, 'Clean Habits Quiz', 'How do you stay clean?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How many times a day should you brush your teeth?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Once a week', false, 1), (q_id, 'Twice a day', true, 2), (q_id, 'Once a month', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'When should you wash your hands?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Only in the morning', false, 1), (q_id, 'Before eating and after toilet', true, 2), (q_id, 'Never', false, 3);

    -- Lesson 6.2: Healthy Food
    l_healthy_food := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_healthy_food, ch_habits, 'Healthy Food', 'Learn about fruits, vegetables, and healthy eating', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_healthy_food, 'Healthy or Unhealthy?', tap_id, '{"prompt":"Is an APPLE healthy?","options":[{"id":"yes","label":"Yes"},{"id":"no","label":"No"}],"correct_id":"yes"}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_healthy_food, 'Sort Healthy Food', drag_drop_id, '{"items":[{"id":"apple","label":"Apple"},{"id":"candy","label":"Candy"},{"id":"carrot","label":"Carrot"},{"id":"milk","label":"Milk"}],"targets":[{"id":"healthy","label":"Healthy"},{"id":"unhealthy","label":"Unhealthy"}]}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_healthy_food, 'Healthy Food Quiz', 'Yummy and healthy!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which food is HEALTHY?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Candy', false, 1), (q_id, 'Apple', true, 2), (q_id, 'Chips', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which drink is good for strong bones?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Soda', false, 1), (q_id, 'Milk', true, 2), (q_id, 'Juice', false, 3);

    -- Lesson 6.3: My Daily Routine
    l_daily_routine := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_daily_routine, ch_habits, 'My Daily Routine', 'Learn about the daily routine: morning, day, and night', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_daily_routine, 'What Comes Next?', tap_id, '{"prompt":"After waking up, what do you do?","options":[{"id":"brush","label":"Brush teeth"},{"id":"sleep","label":"Sleep again"},{"id":"play","label":"Play"}],"correct_id":"brush"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_daily_routine, 'Daily Routine Quiz', 'Your daily routine!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'What do you do in the MORNING?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Wake up and brush teeth', true, 1), (q_id, 'Eat dinner', false, 2), (q_id, 'Go to sleep', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'What do you do at NIGHT?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Play outside', false, 1), (q_id, 'Sleep after dinner', true, 2), (q_id, 'Eat breakfast', false, 3);

END $$;
