-- ═══════════════════════════════════════════════════════════════════════════════
-- LKG ENGLISH — EXTRA TOPICS (Colors, Shapes, Fruits & Veg, Animals, Body Parts, Family)
-- Add-on chapters that cover CBSE LKG EVS / General Awareness topics
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

    subj_id      UUID := (SELECT s.id FROM subjects s JOIN grades g ON s.grade_id = g.id WHERE g.code = 'lkg' AND s.code = 'english');

    next_order   INT;
    ch_colors   UUID; ch_shapes UUID; ch_fruits UUID;
    ch_animals  UUID; ch_body UUID; ch_family UUID;
    l_id UUID; act_id UUID; quiz_id UUID; q_id UUID;
    existing_id UUID;
BEGIN

    next_order := (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM chapters WHERE subject_id = subj_id AND deleted_at IS NULL);

    -- ═══════════════════════════════════════════════════════════════════════════
    -- HELPER: Create chapter if not exists
    -- ═══════════════════════════════════════════════════════════════════════════
    existing_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'Colors' AND deleted_at IS NULL LIMIT 1);
    IF existing_id IS NULL THEN
        ch_colors := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id) VALUES (ch_colors, subj_id, 'Colors', next_order, active_id);
    ELSE ch_colors := existing_id; END IF;
    next_order := next_order + 1;

    existing_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'Shapes' AND deleted_at IS NULL LIMIT 1);
    IF existing_id IS NULL THEN
        ch_shapes := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id) VALUES (ch_shapes, subj_id, 'Shapes', next_order, active_id);
    ELSE ch_shapes := existing_id; END IF;
    next_order := next_order + 1;

    existing_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'Fruits & Vegetables' AND deleted_at IS NULL LIMIT 1);
    IF existing_id IS NULL THEN
        ch_fruits := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id) VALUES (ch_fruits, subj_id, 'Fruits & Vegetables', next_order, active_id);
    ELSE ch_fruits := existing_id; END IF;
    next_order := next_order + 1;

    existing_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'Animals' AND deleted_at IS NULL LIMIT 1);
    IF existing_id IS NULL THEN
        ch_animals := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id) VALUES (ch_animals, subj_id, 'Animals', next_order, active_id);
    ELSE ch_animals := existing_id; END IF;
    next_order := next_order + 1;

    existing_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'Body Parts' AND deleted_at IS NULL LIMIT 1);
    IF existing_id IS NULL THEN
        ch_body := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id) VALUES (ch_body, subj_id, 'Body Parts', next_order, active_id);
    ELSE ch_body := existing_id; END IF;
    next_order := next_order + 1;

    existing_id := (SELECT id FROM chapters WHERE subject_id = subj_id AND name = 'My Family & Myself' AND deleted_at IS NULL LIMIT 1);
    IF existing_id IS NULL THEN
        ch_family := gen_random_uuid();
        INSERT INTO chapters (id, subject_id, name, sort_order, status_id) VALUES (ch_family, subj_id, 'My Family & Myself', next_order, active_id);
    ELSE ch_family := existing_id; END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- HELPER: Insert lesson + activities + quiz if not exists
    -- ═══════════════════════════════════════════════════════════════════════════

    -- 📘 Lesson: Red, Blue, Yellow, Green
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_colors AND title = 'Red, Blue, Yellow, Green' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_colors, 'Red, Blue, Yellow, Green', 'Learn to identify red, blue, yellow and green colors', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Color Match', match_id, '{"pairs":[{"color":"Red","item":"Apple"},{"color":"Blue","item":"Sky"},{"color":"Yellow","item":"Sun"},{"color":"Green","item":"Grass"}]}', 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Tap the Color', tap_id, '{"prompt":"Tap the color Red","options":[{"id":"red","label":"🔴 Red"},{"id":"blue","label":"🔵 Blue"},{"id":"yellow","label":"🟡 Yellow"},{"id":"green","label":"🟢 Green"}],"correct_id":"red"}', 2, active_id);

        quiz_id := gen_random_uuid(); INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id) VALUES (quiz_id, l_id, 'Colors 1 Quiz', 'Red, Blue, Yellow, Green', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'What color is the sky?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Red', false, 1), (q_id, 'Blue', true, 2), (q_id, 'Green', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'What color is the sun?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Blue', false, 1), (q_id, 'Green', false, 2), (q_id, 'Yellow', true, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'An apple is ___?', mcq_id, 10, 3, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Red', true, 1), (q_id, 'Blue', false, 2), (q_id, 'Yellow', false, 3);
    END IF;

    -- 📘 Lesson: Orange, Purple, Pink, Brown
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_colors AND title = 'Orange, Purple, Pink, Brown' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_colors, 'Orange, Purple, Pink, Brown', 'Learn orange, purple, pink and brown colors', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Color Hunt', tap_id, '{"prompt":"Tap the color Orange","options":[{"id":"orange","label":"🟠 Orange"},{"id":"purple","label":"🟣 Purple"},{"id":"pink","label":"🩷 Pink"},{"id":"brown","label":"🟤 Brown"}],"correct_id":"orange"}', 1, active_id);

        quiz_id := gen_random_uuid(); INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id) VALUES (quiz_id, l_id, 'Colors 2 Quiz', 'Orange, Purple, Pink, Brown', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'A carrot is ___?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Pink', false, 1), (q_id, 'Purple', false, 2), (q_id, 'Orange', true, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'A frog is ___?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Brown', false, 1), (q_id, 'Green', true, 2), (q_id, 'Orange', false, 3);
    END IF;

    -- 📘 Lesson: White, Black & Color Review
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_colors AND title = 'White, Black & Color Review' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_colors, 'White, Black & Color Review', 'Learn white, black, gray and review all colors', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 3, active_id);

        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Color Sorting', match_id, '{"pairs":[{"color":"🟡","label":"Yellow"},{"color":"🔴","label":"Red"},{"color":"🔵","label":"Blue"},{"color":"🟢","label":"Green"},{"color":"🟠","label":"Orange"}]}', 1, active_id);

        quiz_id := gen_random_uuid(); INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id) VALUES (quiz_id, l_id, 'All Colors Quiz', 'Review all the colors we learned', 90, easy_id, 1, active_id);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'A polar bear is ___?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Brown', false, 1), (q_id, 'White', true, 2), (q_id, 'Gray', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Night sky is ___?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'White', false, 1), (q_id, 'Blue', false, 2), (q_id, 'Black', true, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- Shapes chapter
    -- ═══════════════════════════════════════════════════════════════════════════

    -- 📘 Lesson: Circle, Square, Triangle
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_shapes AND title = 'Circle, Square, Triangle' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_shapes, 'Circle, Square, Triangle', 'Learn to identify circles, squares and triangles', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Shape Match', match_id, '{"pairs":[{"shape":"Circle","emoji":"⭕"},{"shape":"Square","emoji":"⬜"},{"shape":"Triangle","emoji":"🔺"},{"shape":"Star","emoji":"⭐"},{"shape":"Heart","emoji":"❤️"}]}', 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Find the Shape', tap_id, '{"prompt":"Tap the Circle","options":[{"id":"circle","label":"⭕ Circle"},{"id":"square","label":"⬜ Square"},{"id":"triangle","label":"🔺 Triangle"}],"correct_id":"circle"}', 2, active_id);

        quiz_id := gen_random_uuid(); INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id) VALUES (quiz_id, l_id, 'Shapes 1 Quiz', 'Circle, Square, Triangle', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'A ball is which shape?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Square', false, 1), (q_id, 'Circle', true, 2), (q_id, 'Triangle', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'How many sides does a triangle have?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '2', false, 1), (q_id, '3', true, 2), (q_id, '4', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'A clock is shaped like a ___?', mcq_id, 10, 3, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Square', false, 1), (q_id, 'Triangle', false, 2), (q_id, 'Circle', true, 3);
    END IF;

    -- 📘 Lesson: Rectangle, Star, Diamond, Heart, Oval
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_shapes AND title = 'Rectangle, Star, Diamond, Heart, Oval' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_shapes, 'Rectangle, Star, Diamond, Heart, Oval', 'Learn more shapes: rectangle, star, diamond, heart, oval', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 2, active_id);

        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Shape Hunt', tap_id, '{"prompt":"Tap the Star","options":[{"id":"star","label":"⭐ Star"},{"id":"diamond","label":"💎 Diamond"},{"id":"heart","label":"❤️ Heart"},{"id":"oval","label":"🥚 Oval"}],"correct_id":"star"}', 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'More Shape Match', match_id, '{"pairs":[{"shape":"Star","emoji":"⭐"},{"shape":"Heart","emoji":"❤️"},{"shape":"Diamond","emoji":"💎"},{"shape":"Oval","emoji":"🥚"},{"shape":"Rectangle","emoji":"📘"}]}', 2, active_id);

        quiz_id := gen_random_uuid(); INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id) VALUES (quiz_id, l_id, 'Shapes 2 Quiz', 'Rectangle, Star, Diamond, Heart, Oval', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'A door is shaped like a ___?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Circle', false, 1), (q_id, 'Rectangle', true, 2), (q_id, 'Triangle', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Which shape is in the sky at night?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Heart', false, 1), (q_id, 'Diamond', false, 2), (q_id, 'Star', true, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- Fruits & Vegetables chapter
    -- ═══════════════════════════════════════════════════════════════════════════

    -- 📘 Lesson: Fruits - Apple, Banana, Mango, Orange, Grapes
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_fruits AND title = 'Fruits - Apple, Banana, Mango, Orange, Grapes' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_fruits, 'Fruits - Apple, Banana, Mango, Orange, Grapes', 'Learn names of common fruits', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Fruit Match', match_id, '{"pairs":[{"fruit":"Apple","emoji":"🍎"},{"fruit":"Banana","emoji":"🍌"},{"fruit":"Mango","emoji":"🥭"},{"fruit":"Orange","emoji":"🍊"},{"fruit":"Grapes","emoji":"🍇"}]}', 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Find the Fruit', tap_id, '{"prompt":"Tap the Banana","options":[{"id":"apple","label":"🍎 Apple"},{"id":"banana","label":"🍌 Banana"},{"id":"orange","label":"🍊 Orange"},{"id":"grapes","label":"🍇 Grapes"}],"correct_id":"banana"}', 2, active_id);

        quiz_id := gen_random_uuid(); INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id) VALUES (quiz_id, l_id, 'Fruits Quiz', 'Name that fruit!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Which fruit is red and round?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Banana', false, 1), (q_id, 'Apple', true, 2), (q_id, 'Grapes', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Which fruit is yellow and long?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Banana', true, 1), (q_id, 'Orange', false, 2), (q_id, 'Mango', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Grapes grow in a ___?', mcq_id, 10, 3, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Tree', false, 1), (q_id, 'Bunch', true, 2), (q_id, 'Single', false, 3);
    END IF;

    -- 📘 Lesson: Vegetables - Carrot, Tomato, Potato, Onion, Cabbage
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_fruits AND title = 'Vegetables - Carrot, Tomato, Potato, Onion, Cabbage' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_fruits, 'Vegetables - Carrot, Tomato, Potato, Onion, Cabbage', 'Learn names of common vegetables', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Vegetable Match', match_id, '{"pairs":[{"veg":"Carrot","emoji":"🥕"},{"veg":"Tomato","emoji":"🍅"},{"veg":"Potato","emoji":"🥔"},{"veg":"Onion","emoji":"🧅"},{"veg":"Cabbage","emoji":"🥬"}]}', 1, active_id);

        quiz_id := gen_random_uuid(); INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id) VALUES (quiz_id, l_id, 'Vegetables Quiz', 'Name that vegetable!', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Which vegetable is orange and long?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Tomato', false, 1), (q_id, 'Carrot', true, 2), (q_id, 'Potato', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Which vegetable is red and round?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Onion', false, 1), (q_id, 'Cabbage', false, 2), (q_id, 'Tomato', true, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'French fries are made from ___?', mcq_id, 10, 3, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Carrot', false, 1), (q_id, 'Potato', true, 2), (q_id, 'Onion', false, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- Animals chapter
    -- ═══════════════════════════════════════════════════════════════════════════

    -- 📘 Lesson: Domestic Animals
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_animals AND title = 'Domestic Animals' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_animals, 'Domestic Animals', 'Learn about animals that live with us - cow, dog, cat, hen, horse', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 1, active_id);

        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Animal Sounds', match_id, '{"pairs":[{"animal":"Cow","sound":"Moo 🐄"},{"animal":"Dog","sound":"Woof 🐕"},{"animal":"Cat","sound":"Meow 🐱"},{"animal":"Hen","sound":"Cluck 🐔"},{"animal":"Horse","sound":"Neigh 🐴"}]}', 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Find the Animal', tap_id, '{"prompt":"Tap the Cat","options":[{"id":"cow","label":"🐄 Cow"},{"id":"dog","label":"🐕 Dog"},{"id":"cat","label":"🐱 Cat"},{"id":"hen","label":"🐔 Hen"}],"correct_id":"cat"}', 2, active_id);

        quiz_id := gen_random_uuid(); INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id) VALUES (quiz_id, l_id, 'Domestic Animals Quiz', 'Animals that live with us', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Which animal says Moo?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Dog', false, 1), (q_id, 'Cow', true, 2), (q_id, 'Cat', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Which animal gives us milk?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Hen', false, 1), (q_id, 'Dog', false, 2), (q_id, 'Cow', true, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'A puppy is a baby ___?', mcq_id, 10, 3, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Cat', false, 1), (q_id, 'Dog', true, 2), (q_id, 'Horse', false, 3);
    END IF;

    -- 📘 Lesson: Wild Animals
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_animals AND title = 'Wild Animals' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_animals, 'Wild Animals', 'Learn about wild animals - lion, tiger, elephant, giraffe, monkey', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 2, active_id);

        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Wild Animal Match', match_id, '{"pairs":[{"animal":"Lion","desc":"👑 King of jungle"},{"animal":"Elephant","desc":"🐘 Big and strong"},{"animal":"Giraffe","desc":"🦒 Tall neck"},{"animal":"Monkey","desc":"🐒 Jumps on trees"}]}', 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Guess the Wild Animal', tap_id, '{"prompt":"Which animal is the king of the jungle?","options":[{"id":"lion","label":"🦁 Lion"},{"id":"tiger","label":"🐯 Tiger"},{"id":"bear","label":"🐻 Bear"},{"id":"zebra","label":"🦓 Zebra"}],"correct_id":"lion"}', 2, active_id);

        quiz_id := gen_random_uuid(); INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id) VALUES (quiz_id, l_id, 'Wild Animals Quiz', 'Animals in the wild', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Which animal has a long trunk?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Lion', false, 1), (q_id, 'Elephant', true, 2), (q_id, 'Monkey', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Which animal has black and white stripes?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Giraffe', false, 1), (q_id, 'Tiger', false, 2), (q_id, 'Zebra', true, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Which animal has the longest neck?', mcq_id, 10, 3, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Giraffe', true, 1), (q_id, 'Elephant', false, 2), (q_id, 'Bear', false, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- Body Parts chapter
    -- ═══════════════════════════════════════════════════════════════════════════

    -- 📘 Lesson: Head, Eyes, Nose, Ears, Mouth
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_body AND title = 'Head, Eyes, Nose, Ears, Mouth' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_body, 'Head, Eyes, Nose, Ears, Mouth', 'Learn about the parts on your face', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Body Parts Match', match_id, '{"pairs":[{"part":"Eyes","action":"👀 See"},{"part":"Nose","action":"👃 Smell"},{"part":"Ears","action":"👂 Hear"},{"part":"Mouth","action":"👄 Speak & Eat"},{"part":"Head","action":"🧠 Think"}]}', 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Tap the Body Part', tap_id, '{"prompt":"What do you use to see?","options":[{"id":"eyes","label":"👀 Eyes"},{"id":"ears","label":"👂 Ears"},{"id":"nose","label":"👃 Nose"},{"id":"mouth","label":"👄 Mouth"}],"correct_id":"eyes"}', 2, active_id);

        quiz_id := gen_random_uuid(); INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id) VALUES (quiz_id, l_id, 'Face Parts Quiz', 'Parts of your face', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Which part do you use to smell a flower?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Eyes', false, 1), (q_id, 'Nose', true, 2), (q_id, 'Ears', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Which part do you use to hear music?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Ears', true, 1), (q_id, 'Eyes', false, 2), (q_id, 'Mouth', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Which part do you use to eat food?', mcq_id, 10, 3, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Nose', false, 1), (q_id, 'Ears', false, 2), (q_id, 'Mouth', true, 3);
    END IF;

    -- 📘 Lesson: Hands, Legs, Knees, Toes
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_body AND title = 'Hands, Legs, Knees, Toes' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_body, 'Hands, Legs, Knees, Toes', 'Learn about your body from head to toe', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Body Movement Match', match_id, '{"pairs":[{"part":"Hands","action":"✋ Hold & Wave"},{"part":"Legs","action":"🦵 Walk & Run"},{"part":"Knees","action":"🦵 Bend"},{"part":"Toes","action":"🦶 Wiggle"}]}', 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Head Shoulders Song Tap', tap_id, '{"prompt":"Touch your ___!","options":[{"id":"head","label":"🧠 Head"},{"id":"shoulders","label":"💪 Shoulders"},{"id":"knees","label":"🦵 Knees"},{"id":"toes","label":"🦶 Toes"}],"correct_id":"head"}', 2, active_id);

        quiz_id := gen_random_uuid(); INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id) VALUES (quiz_id, l_id, 'Body Parts Quiz', 'All about our body', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'What do you use to clap?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Feet', false, 1), (q_id, 'Hands', true, 2), (q_id, 'Knees', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'What do you use to run?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Hands', false, 1), (q_id, 'Legs', true, 2), (q_id, 'Eyes', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'How many hands do you have?', mcq_id, 10, 3, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'One', false, 1), (q_id, 'Two', true, 2), (q_id, 'Four', false, 3);
    END IF;

    -- ═══════════════════════════════════════════════════════════════════════════
    -- My Family & Myself chapter
    -- ═══════════════════════════════════════════════════════════════════════════

    -- 📘 Lesson: Myself - My Name, Age
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_family AND title = 'Myself - My Name, Age' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_family, 'Myself - My Name, Age', 'Learn to introduce yourself - name, age, and how you feel', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'All About Me', tap_id, '{"prompt":"What is your name?","options":[{"id":"name","label":"My name is ___"},{"id":"age","label":"I am ___ years old"},{"id":"feel","label":"I am happy! 😊"}],"correct_id":"name"}', 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Feelings Match', match_id, '{"pairs":[{"feeling":"Happy","emoji":"😊"},{"feeling":"Sad","emoji":"😢"},{"feeling":"Angry","emoji":"😡"},{"feeling":"Sleepy","emoji":"😴"}]}', 2, active_id);

        quiz_id := gen_random_uuid(); INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id) VALUES (quiz_id, l_id, 'Myself Quiz', 'All about me', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'When you smile, you are ___?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Sad', false, 1), (q_id, 'Happy', true, 2), (q_id, 'Angry', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'A boy is called ___?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'She', false, 1), (q_id, 'He', true, 2), (q_id, 'It', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'A girl is called ___?', mcq_id, 10, 3, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'She', true, 1), (q_id, 'He', false, 2), (q_id, 'It', false, 3);
    END IF;

    -- 📘 Lesson: My Family - Mommy, Daddy, Siblings, Grandparents
    l_id := (SELECT id FROM lessons WHERE chapter_id = ch_family AND title = 'My Family - Mommy, Daddy, Siblings, Grandparents' AND deleted_at IS NULL LIMIT 1);
    IF l_id IS NULL THEN
        l_id := gen_random_uuid();
        INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
        VALUES (l_id, ch_family, 'My Family - Mommy, Daddy, Siblings, Grandparents', 'Learn about your family members', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Family Match', match_id, '{"pairs":[{"member":"Mommy","emoji":"👩"},{"member":"Daddy","emoji":"👨"},{"member":"Brother","emoji":"👦"},{"member":"Sister","emoji":"👧"},{"member":"Grandpa","emoji":"👴"},{"member":"Grandma","emoji":"👵"}]}', 1, active_id);
        act_id := gen_random_uuid(); INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id) VALUES (act_id, l_id, 'Who is this?', tap_id, '{"prompt":"Who cooks food for you at home?","options":[{"id":"mommy","label":"👩 Mommy"},{"id":"daddy","label":"👨 Daddy"},{"id":"grandma","label":"👵 Grandma"},{"id":"brother","label":"👦 Brother"}],"correct_id":"mommy"}', 2, active_id);

        quiz_id := gen_random_uuid(); INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id) VALUES (quiz_id, l_id, 'My Family Quiz', 'People in your family', 60, easy_id, 1, active_id);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Your mother''s mother is your ___?', mcq_id, 10, 1, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Grandma', true, 1), (q_id, 'Mommy', false, 2), (q_id, 'Sister', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'Your parents'' son is your ___?', mcq_id, 10, 2, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Sister', false, 1), (q_id, 'Brother', true, 2), (q_id, 'Daddy', false, 3);
        q_id := gen_random_uuid(); INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id) VALUES (q_id, quiz_id, 'How many parents do you have?', mcq_id, 10, 3, active_id);
        INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'One', false, 1), (q_id, 'Two', true, 2), (q_id, 'Three', false, 3);
    END IF;

END $$;
