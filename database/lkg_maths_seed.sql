-- ═══════════════════════════════════════════════════════════════════════════════
-- LKG MATHEMATICS — COMPLETE SEED DATA
-- 7 Chapters, 32 Lessons — CBSE "quantity sense before symbol" approach
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

    subj_id      UUID := (SELECT s.id FROM subjects s JOIN grades g ON s.grade_id = g.id WHERE g.code = 'lkg' AND s.code = 'maths');

    -- chapter UUIDs
    ch_premath   UUID := gen_random_uuid();
    ch_shapes    UUID := gen_random_uuid();
    ch_num1_5    UUID := gen_random_uuid();
    ch_num6_10   UUID := gen_random_uuid();
    ch_position  UUID := gen_random_uuid();
    ch_sort      UUID := gen_random_uuid();
    ch_patterns  UUID := gen_random_uuid();

    -- lesson UUIDs
    l_big_small        UUID; l_tall_short       UUID; l_more_less       UUID;
    l_heavy_light      UUID; l_same_diff_obj    UUID;

    l_circle_square    UUID; l_tri_rect         UUID; l_shapes_around   UUID;
    l_find_shape       UUID; l_shape_sort       UUID;

    l_how_1_2          UUID; l_how_3_4          UUID; l_how_5           UUID;
    l_review_1_5       UUID;

    l_how_6_7          UUID; l_how_8_10         UUID; l_count_objects   UUID;
    l_count_match      UUID; l_before_after     UUID;

    l_inside_outside   UUID; l_above_below      UUID; l_top_bottom      UUID;
    l_left_right       UUID; l_near_far         UUID; l_open_close      UUID;

    l_sort_color       UUID; l_sort_size        UUID; l_compare_groups  UUID;
    l_same_diff        UUID;

    l_color_patterns   UUID; l_shape_patterns   UUID; l_complete_pattern UUID;

    act_id UUID; quiz_id UUID; q_id UUID;
BEGIN

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 1: Pre-Math Concepts
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_premath, subj_id, 'Pre-Math Concepts', 1, active_id);

    -- Lesson 1.1: Big & Small
    l_big_small := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_big_small, ch_premath, 'Big & Small', 'Learn to identify big and small objects', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_big_small, 'Tap the Big One', tap_id, '{"prompt":"Tap the BIG animal","options":[{"id":"elephant","label":"🐘 Elephant","image":""},{"id":"mouse","label":"🐁 Mouse","image":""}],"correct_id":"elephant"}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_big_small, 'Sort Big & Small', drag_drop_id, '{"items":[{"id":"elephant","label":"🐘"},{"id":"mouse","label":"🐁"},{"id":"whale","label":"🐋"},{"id":"ant","label":"🐜"}],"targets":[{"id":"big","label":"Big"},{"id":"small","label":"Small"}]}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_big_small, 'Big & Small Quiz', 'Show what you know about big and small!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which animal is BIG?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🐁 Mouse', false, 1), (q_id, '🐘 Elephant', true, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which one is SMALL?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🪨 Rock', false, 1), (q_id, '🪶 Feather', true, 2);

    -- Lesson 1.2: Tall & Short
    l_tall_short := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_tall_short, ch_premath, 'Tall & Short', 'Learn to identify tall and short objects', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_tall_short, 'Tap the Tall One', tap_id, '{"prompt":"Tap the TALL one","options":[{"id":"tree","label":"🌳 Tree"},{"id":"flower","label":"🌷 Flower"}],"correct_id":"tree"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_tall_short, 'Tall & Short Quiz', 'Can you tell tall from short?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which is TALL?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🌷 Flower', false, 1), (q_id, '🌳 Tree', true, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which is SHORT?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🏢 Building', false, 1), (q_id, '🌱 Seedling', true, 2);

    -- Lesson 1.3: More & Less
    l_more_less := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_more_less, ch_premath, 'More & Less', 'Compare quantities to find more and less', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_more_less, 'More Apples Please', tap_id, '{"prompt":"Which basket has MORE apples?","options":[{"id":"three","label":"🍎🍎🍎 (3 apples)"},{"id":"one","label":"🍎 (1 apple)"}],"correct_id":"three"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_more_less, 'More & Less Quiz', 'Compare and choose!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which has MORE?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🍪🍪 (2 cookies)', false, 1), (q_id, '🍪🍪🍪🍪🍪 (5 cookies)', true, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which has LESS?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '⭐ (1 star)', true, 1), (q_id, '⭐⭐⭐ (3 stars)', false, 2);

    -- Lesson 1.4: Heavy & Light
    l_heavy_light := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_heavy_light, ch_premath, 'Heavy & Light', 'Learn the difference between heavy and light objects', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 4, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_heavy_light, 'Heavy or Light?', tap_id, '{"prompt":"Which is HEAVY?","options":[{"id":"rock","label":"🪨 Rock"},{"id":"feather","label":"🪶 Feather"}],"correct_id":"rock"}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_heavy_light, 'Sort Heavy & Light', drag_drop_id, '{"items":[{"id":"rock","label":"🪨"},{"id":"feather","label":"🪶"},{"id":"book","label":"📚"},{"id":"balloon","label":"🎈"}],"targets":[{"id":"heavy","label":"Heavy"},{"id":"light","label":"Light"}]}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_heavy_light, 'Heavy & Light Quiz', 'Test your heavy and light knowledge!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which is HEAVY?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🎈 Balloon', false, 1), (q_id, '🪨 Rock', true, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which is LIGHT?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🪶 Feather', true, 1), (q_id, '📚 Big Book', false, 2);

    -- Lesson 1.5: Same & Different Objects
    l_same_diff_obj := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_same_diff_obj, ch_premath, 'Same & Different Objects', 'Find objects that are the same or different', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 5, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_same_diff_obj, 'Find the Same', match_id, '{"pairs":[{"left":"🍎 Apple","right":"🍎 Apple"},{"left":"🧸 Teddy","right":"🧸 Teddy"},{"left":"⚽ Ball","right":"⚽ Ball"}]}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_same_diff_obj, 'Same & Different Quiz', 'Can you spot the difference?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which one is DIFFERENT?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🍎🍎 (two apples)', false, 1), (q_id, '🍎🍊 (apple and orange)', true, 2);

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 2: Shapes & Spatial Awareness
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_shapes, subj_id, 'Shapes & Spatial Awareness', 2, active_id);

    -- Lesson 2.1: Circle & Square
    l_circle_square := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_circle_square, ch_shapes, 'Circle & Square', 'Learn to identify circles and squares', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_circle_square, 'Trace the Shapes', tracing_id, '{"shapes":["circle","square"],"color":"#FF6B35","thickness":4}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_circle_square, 'Circle or Square?', tap_id, '{"prompt":"Tap the CIRCLE","options":[{"id":"circle","label":"⭕ Circle"},{"id":"square","label":"⬛ Square"}],"correct_id":"circle"}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_circle_square, 'Circle & Square Quiz', 'Name these shapes!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which shape is round?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '⬛ Square', false, 1), (q_id, '⭕ Circle', true, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which shape has 4 sides?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '⭕ Circle', false, 1), (q_id, '⬛ Square', true, 2);

    -- Lesson 2.2: Triangle & Rectangle
    l_tri_rect := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_tri_rect, ch_shapes, 'Triangle & Rectangle', 'Learn to identify triangles and rectangles', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_tri_rect, 'Trace Triangle & Rectangle', tracing_id, '{"shapes":["triangle","rectangle"],"color":"#22C55E","thickness":4}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_tri_rect, 'Triangle & Rectangle Quiz', 'Learn these new shapes!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which shape has 3 sides?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🔺 Triangle', true, 1), (q_id, '▬ Rectangle', false, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which shape is like a door?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🔺 Triangle', false, 1), (q_id, '▬ Rectangle', true, 2);

    -- Lesson 2.3: Shapes Around Us
    l_shapes_around := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_shapes_around, ch_shapes, 'Shapes Around Us', 'Find shapes in everyday objects around us', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_shapes_around, 'Match Shape to Object', match_id, '{"pairs":[{"shape":"⭕ Circle","object":"⚽ Ball"},{"shape":"⬛ Square","object":"🎲 Dice"},{"shape":"🔺 Triangle","object":"🍕 Pizza Slice"},{"shape":"▬ Rectangle","object":"🚪 Door"}]}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_shapes_around, 'Shapes Around Us Quiz', 'Find shapes in the world!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'A clock is which shape?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '⬛ Square', false, 1), (q_id, '⭕ Circle', true, 2), (q_id, '🔺 Triangle', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'A window is which shape?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '⭕ Circle', false, 1), (q_id, '🔺 Triangle', false, 2), (q_id, '⬛ Square', true, 3);

    -- Lesson 2.4: Find the Shape
    l_find_shape := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_find_shape, ch_shapes, 'Find the Shape', 'Practice identifying shapes by name', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 4, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_find_shape, 'Find the Circle', tap_id, '{"prompt":"Find the CIRCLE","options":[{"id":"circle","label":"⭕"},{"id":"square","label":"⬛"},{"id":"triangle","label":"🔺"},{"id":"rectangle","label":"▬"}],"correct_id":"circle"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_find_shape, 'Find the Shape Quiz', 'Can you find each shape?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which shape has no corners?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '⬛ Square', false, 1), (q_id, '⭕ Circle', true, 2), (q_id, '🔺 Triangle', false, 3);

    -- Lesson 2.5: Shape Sorting
    l_shape_sort := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_shape_sort, ch_shapes, 'Shape Sorting', 'Sort shapes into groups', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 5, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_shape_sort, 'Sort the Shapes', drag_drop_id, '{"items":[{"id":"circle","label":"⭕"},{"id":"square","label":"⬛"},{"id":"triangle","label":"🔺"},{"id":"circle2","label":"⭕"}],"targets":[{"id":"circles","label":"Circles"},{"id":"others","label":"Not Circles"}]}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_shape_sort, 'Shape Sorting Quiz', 'Show your sorting skills!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which group has only CIRCLES?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '⭕⭕ (two circles)', true, 1), (q_id, '⬛🔺 (square and triangle)', false, 2);

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 3: Numbers 1-5
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_num1_5, subj_id, 'Numbers 1-5', 3, active_id);

    -- Lesson 3.1: How Many? 1 & 2
    l_how_1_2 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_how_1_2, ch_num1_5, 'How Many? 1 & 2', 'Count objects and recognize numbers 1 and 2', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_how_1_2, 'Trace 1 & 2', tracing_id, '{"numbers":[1,2],"color":"#FF6B35","thickness":4}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_how_1_2, 'Count the Apples', tap_id, '{"prompt":"How many apples? 🍎🍎","options":[{"id":"1","label":"1"},{"id":"2","label":"2"},{"id":"3","label":"3"}],"correct_id":"2"}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_how_1_2, 'Numbers 1 & 2 Quiz', 'Count and choose!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How many stars? ⭐', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '1', true, 1), (q_id, '2', false, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How many balloons? 🎈🎈', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '1', false, 1), (q_id, '2', true, 2);

    -- Lesson 3.2: How Many? 3 & 4
    l_how_3_4 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_how_3_4, ch_num1_5, 'How Many? 3 & 4', 'Count objects and recognize numbers 3 and 4', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_how_3_4, 'Trace 3 & 4', tracing_id, '{"numbers":[3,4],"color":"#22C55E","thickness":4}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_how_3_4, 'Count the Kittens', tap_id, '{"prompt":"How many kittens? 🐱🐱🐱","options":[{"id":"2","label":"2"},{"id":"3","label":"3"},{"id":"4","label":"4"}],"correct_id":"3"}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_how_3_4, 'Numbers 3 & 4 Quiz', 'Count to 3 and 4!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How many leaves? 🍀🍀🍀🍀', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '3', false, 1), (q_id, '4', true, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Show me 3 fingers! Which number is that?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '2', false, 1), (q_id, '3', true, 2), (q_id, '4', false, 3);

    -- Lesson 3.3: How Many? 5
    l_how_5 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_how_5, ch_num1_5, 'How Many? 5', 'Count objects and recognize the number 5', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_how_5, 'Trace 5', tracing_id, '{"numbers":[5],"color":"#F59E0B","thickness":4}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_how_5, 'Count the Stars', tap_id, '{"prompt":"How many stars? ⭐⭐⭐⭐⭐","options":[{"id":"4","label":"4"},{"id":"5","label":"5"},{"id":"6","label":"6"}],"correct_id":"5"}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_how_5, 'Number 5 Quiz', 'All about the number 5!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How many fingers on one hand?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '4', false, 1), (q_id, '5', true, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Count the dots: ⚫⚫⚫⚫⚫', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '4', false, 1), (q_id, '5', true, 2), (q_id, '6', false, 3);

    -- Lesson 3.4: Count & Review 1-5
    l_review_1_5 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_review_1_5, ch_num1_5, 'Count & Review 1-5', 'Review counting from 1 to 5', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 4, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_review_1_5, 'Count & Match 1-5', match_id, '{"pairs":[{"number":"1","group":"⭐"},{"number":"2","group":"⭐⭐"},{"number":"3","group":"⭐⭐⭐"},{"number":"4","group":"⭐⭐⭐⭐"},{"number":"5","group":"⭐⭐⭐⭐⭐"}]}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_review_1_5, 'Numbers 1-5 Review Quiz', 'You know numbers 1 to 5!', 90, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'What comes after 2?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '1', false, 1), (q_id, '3', true, 2), (q_id, '4', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Count: 1, 2, 3, __, 5', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '2', false, 1), (q_id, '4', true, 2), (q_id, '6', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How many in total: 1 to 5?', mcq_id, 10, 3, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '4 numbers', false, 1), (q_id, '5 numbers', true, 2), (q_id, '6 numbers', false, 3);

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 4: Numbers 6-10 & Counting
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_num6_10, subj_id, 'Numbers 6-10 & Counting', 4, active_id);

    -- Lesson 4.1: How Many? 6 & 7
    l_how_6_7 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_how_6_7, ch_num6_10, 'How Many? 6 & 7', 'Count objects and recognize numbers 6 and 7', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_how_6_7, 'Trace 6 & 7', tracing_id, '{"numbers":[6,7],"color":"#6366F1","thickness":4}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_how_6_7, 'Count the Fish', tap_id, '{"prompt":"How many fish? 🐟🐟🐟🐟🐟🐟","options":[{"id":"5","label":"5"},{"id":"6","label":"6"},{"id":"7","label":"7"}],"correct_id":"6"}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_how_6_7, 'Numbers 6 & 7 Quiz', 'Count to 6 and 7!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How many stars? ⭐⭐⭐⭐⭐⭐', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '5', false, 1), (q_id, '6', true, 2), (q_id, '7', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '6 comes after which number?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '4', false, 1), (q_id, '5', true, 2), (q_id, '7', false, 3);

    -- Lesson 4.2: How Many? 8 to 10
    l_how_8_10 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_how_8_10, ch_num6_10, 'How Many? 8 to 10', 'Count objects and recognize numbers 8, 9, and 10', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_how_8_10, 'Trace 8-10', tracing_id, '{"numbers":[8,9,10],"color":"#EC4899","thickness":4}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_how_8_10, 'Count the Penguins', tap_id, '{"prompt":"How many penguins? 🐧🐧🐧🐧🐧🐧🐧🐧","options":[{"id":"7","label":"7"},{"id":"8","label":"8"},{"id":"9","label":"9"}],"correct_id":"8"}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_how_8_10, 'Numbers 8-10 Quiz', 'Count to 8, 9, and 10!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How many balloons? 🎈🎈🎈🎈🎈🎈🎈🎈🎈', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '8', false, 1), (q_id, '9', true, 2), (q_id, '10', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How many fingers on both hands?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '8', false, 1), (q_id, '9', false, 2), (q_id, '10', true, 3);

    -- Lesson 4.3: Count Objects 1-10
    l_count_objects := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_count_objects, ch_num6_10, 'Count Objects 1-10', 'Practice counting objects from 1 to 10', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_count_objects, 'Count the Toys', tap_id, '{"prompt":"How many toys? 🧸🧸🧸🧸","options":[{"id":"3","label":"3"},{"id":"4","label":"4"},{"id":"5","label":"5"}],"correct_id":"4"}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_count_objects, 'Match Number to Objects', match_id, '{"pairs":[{"number":"3","items":"⭐⭐⭐"},{"number":"6","items":"🐟🐟🐟🐟🐟🐟"},{"number":"8","items":"🐧🐧🐧🐧🐧🐧🐧🐧"}]}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_count_objects, 'Count Objects Quiz', 'How many can you count?', 90, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Count: 🐱🐱🐱🐱🐱 = ?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '4', false, 1), (q_id, '5', true, 2), (q_id, '6', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Count: 🐟🐟🐟🐟🐟🐟🐟 = ?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '6', false, 1), (q_id, '7', true, 2), (q_id, '8', false, 3);

    -- Lesson 4.4: Count & Match 1-10
    l_count_match := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_count_match, ch_num6_10, 'Count & Match 1-10', 'Match numbers to groups of objects', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 4, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_count_match, 'Match All Numbers', match_id, '{"pairs":[{"number":"1","group":"⭐"},{"number":"4","group":"🍀🍀🍀🍀"},{"number":"7","group":"🐟🐟🐟🐟🐟🐟🐟"},{"number":"10","group":"🐧🐧🐧🐧🐧🐧🐧🐧🐧🐧"}]}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_count_match, 'Count & Match Quiz', 'Match numbers to groups!', 90, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '10 stars match which number? ⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '9', false, 1), (q_id, '10', true, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which number matches 🎈🎈🎈🎈🎈🎈?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '5', false, 1), (q_id, '6', true, 2), (q_id, '7', false, 3);

    -- Lesson 4.5: Before & After
    l_before_after := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_before_after, ch_num6_10, 'Before & After', 'Learn what numbers come before and after', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 5, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_before_after, 'Before & After Tap', tap_id, '{"prompt":"What comes AFTER 3?","options":[{"id":"2","label":"2"},{"id":"4","label":"4"},{"id":"5","label":"5"}],"correct_id":"4"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_before_after, 'Before & After Quiz', 'What comes next?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'What comes BEFORE 5?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '3', false, 1), (q_id, '4', true, 2), (q_id, '6', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'What comes AFTER 7?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '6', false, 1), (q_id, '8', true, 2), (q_id, '9', false, 3);

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 5: Position Words
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_position, subj_id, 'Position Words', 5, active_id);

    -- Lesson 5.1: Inside & Outside
    l_inside_outside := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_inside_outside, ch_position, 'Inside & Outside', 'Learn the difference between inside and outside', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_inside_outside, 'Inside or Outside?', tap_id, '{"prompt":"Where is the cat? 🐱 (inside the box 📦)","options":[{"id":"inside","label":"Inside"},{"id":"outside","label":"Outside"}],"correct_id":"inside"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_inside_outside, 'Inside & Outside Quiz', 'In or out?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'A fish is ___ water', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'inside', true, 1), (q_id, 'outside', false, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'A bird in the sky is ___ the house', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'inside', false, 1), (q_id, 'outside', true, 2);

    -- Lesson 5.2: Above & Below
    l_above_below := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_above_below, ch_position, 'Above & Below', 'Learn the difference between above and below', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_above_below, 'Above or Below?', tap_id, '{"prompt":"Where is the lamp? 💡 (above the table)","options":[{"id":"above","label":"Above"},{"id":"below","label":"Below"}],"correct_id":"above"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_above_below, 'Above & Below Quiz', 'Up or down?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'The sun is ___ us', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'above', true, 1), (q_id, 'below', false, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'The rug is ___ the table', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'above', false, 1), (q_id, 'below', true, 2);

    -- Lesson 5.3: Top & Bottom
    l_top_bottom := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_top_bottom, ch_position, 'Top & Bottom', 'Learn the difference between top and bottom', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_top_bottom, 'Top or Bottom?', tap_id, '{"prompt":"Where is the star? ⭐ (at the top of the tree 🎄)","options":[{"id":"top","label":"Top"},{"id":"bottom","label":"Bottom"}],"correct_id":"top"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_top_bottom, 'Top & Bottom Quiz', 'Which is top? Which is bottom?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'The peak of a mountain is the ___', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'top', true, 1), (q_id, 'bottom', false, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'The roots of a tree are at the ___', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'top', false, 1), (q_id, 'bottom', true, 2);

    -- Lesson 5.4: Left & Right
    l_left_right := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_left_right, ch_position, 'Left & Right', 'Learn the difference between left and right', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 4, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_left_right, 'Left or Right?', tap_id, '{"prompt":"Which hand is this? 👈","options":[{"id":"left","label":"Left"},{"id":"right","label":"Right"}],"correct_id":"left"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_left_right, 'Left & Right Quiz', 'Left or right?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'You write with your ___ hand', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'left', false, 1), (q_id, 'right', true, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Your heart is on the ___ side', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'left', true, 1), (q_id, 'right', false, 2);

    -- Lesson 5.5: Near & Far
    l_near_far := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_near_far, ch_position, 'Near & Far', 'Learn the difference between near and far', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 5, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_near_far, 'Near or Far?', tap_id, '{"prompt":"The dog is right next to me! Is it near or far? 🐶","options":[{"id":"near","label":"Near"},{"id":"far","label":"Far"}],"correct_id":"near"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_near_far, 'Near & Far Quiz', 'Close or far away?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'A toy you can touch is ___', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'near', true, 1), (q_id, 'far', false, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'The moon in the sky is ___', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'near', false, 1), (q_id, 'far', true, 2);

    -- Lesson 5.6: Open & Close
    l_open_close := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_open_close, ch_position, 'Open & Close', 'Learn the difference between open and close', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 6, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_open_close, 'Open or Close?', tap_id, '{"prompt":"The door is swinging wide! Is it open or closed? 🚪","options":[{"id":"open","label":"Open"},{"id":"close","label":"Close"}],"correct_id":"open"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_open_close, 'Open & Close Quiz', 'Open or closed?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'When you can go through a door, it is ___', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'open', true, 1), (q_id, 'closed', false, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'When a book has its pages together, it is ___', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'open', false, 1), (q_id, 'closed', true, 2);

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 6: Sorting & Comparison
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_sort, subj_id, 'Sorting & Comparison', 6, active_id);

    -- Lesson 6.1: Sort by Color
    l_sort_color := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_sort_color, ch_sort, 'Sort by Color', 'Sort objects by their color', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_sort_color, 'Sort Colors', drag_drop_id, '{"items":[{"id":"apple","label":"🍎 Red"},{"id":"ball","label":"🔴 Red"},{"id":"sky","label":"🔵 Blue"},{"id":"fish","label":"🐟 Blue"}],"targets":[{"id":"red","label":"Red"},{"id":"blue","label":"Blue"}]}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_sort_color, 'Sort by Color Quiz', 'Sort things by color!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which is RED?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🍎 Apple', true, 1), (q_id, '🔵 Sky', false, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which is BLUE?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🍎 Apple', false, 1), (q_id, '🌊 Ocean', true, 2);

    -- Lesson 6.2: Sort by Size
    l_sort_size := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_sort_size, ch_sort, 'Sort by Size', 'Sort objects by their size', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_sort_size, 'Sort by Size', drag_drop_id, '{"items":[{"id":"big_ball","label":"⚽ Big Ball"},{"id":"small_ball","label":"⚾ Small Ball"},{"id":"big_box","label":"📦 Big Box"},{"id":"small_toy","label":"🧸 Small Toy"}],"targets":[{"id":"big","label":"Big"},{"id":"small","label":"Small"}]}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_sort_size, 'Sort by Size Quiz', 'Big or small?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'An elephant is ___, a mouse is ___', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'big, small', true, 1), (q_id, 'small, big', false, 2);

    -- Lesson 6.3: Compare Groups
    l_compare_groups := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_compare_groups, ch_sort, 'Compare Groups', 'Compare groups to find which has more, fewer, or equal', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_compare_groups, 'Which Has More?', tap_id, '{"prompt":"Which group has MORE?","options":[{"id":"group_a","label":"🍪🍪🍪🍪🍪 (5 cookies)"},{"id":"group_b","label":"🍪🍪 (2 cookies)"}],"correct_id":"group_a"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_compare_groups, 'Compare Groups Quiz', 'Which has more?', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '⭐⭐⭐⭐⭐ vs ⭐⭐ — Which has MORE?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '5 stars', true, 1), (q_id, '2 stars', false, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '🐟🐟 vs 🐟🐟🐟🐟 — Which has FEWER?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '2 fish', true, 1), (q_id, '4 fish', false, 2);

    -- Lesson 6.4: Same & Different
    l_same_diff := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_same_diff, ch_sort, 'Same & Different', 'Identify similarities and differences between objects', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 4, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_same_diff, 'Find the Odd One Out', tap_id, '{"prompt":"Which one is DIFFERENT?","options":[{"id":"red1","label":"🔴 Red"},{"id":"red2","label":"🔴 Red"},{"id":"blue","label":"🔵 Blue"}],"correct_id":"blue"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_same_diff, 'Same & Different Quiz', 'Spot what is different!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '🍎🍎🍊 — Which fruit is different?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🍎 Apple', false, 1), (q_id, '🍊 Orange', true, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '⭕⭕⬛ — Which shape is different?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '⭕ Circle', false, 1), (q_id, '⬛ Square', true, 2);

    -- ═══════════════════════════════════════════════════════════════════════════
    -- CHAPTER 7: Patterns
    -- ═══════════════════════════════════════════════════════════════════════════
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_patterns, subj_id, 'Patterns', 7, active_id);

    -- Lesson 7.1: Color Patterns
    l_color_patterns := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_color_patterns, ch_patterns, 'Color Patterns', 'Learn to recognize and continue color patterns', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_color_patterns, 'Complete the Color Pattern', tap_id, '{"prompt":"What comes next? 🔴🔵🔴🔵___","options":[{"id":"red","label":"🔴 Red"},{"id":"blue","label":"🔵 Blue"}],"correct_id":"red"}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_color_patterns, 'Drag the Pattern', drag_drop_id, '{"items":[{"id":"red","label":"🔴"},{"id":"blue","label":"🔵"},{"id":"red","label":"🔴"},{"id":"blue","label":"🔵"}],"targets":[{"id":"pattern","label":"Red Blue Red Blue"}]}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_color_patterns, 'Color Patterns Quiz', 'Finish the pattern!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '🔴🔵🔴🔵🔴___ What comes next?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🔴 Red', false, 1), (q_id, '🔵 Blue', true, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '🟢🟡🟢🟡🟢___ What comes next?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🟢 Green', false, 1), (q_id, '🟡 Yellow', true, 2);

    -- Lesson 7.2: Shape Patterns
    l_shape_patterns := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_shape_patterns, ch_patterns, 'Shape Patterns', 'Learn to recognize and continue shape patterns', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_shape_patterns, 'Complete the Shape Pattern', tap_id, '{"prompt":"What comes next? ⭕🔺⭕🔺___","options":[{"id":"circle","label":"⭕ Circle"},{"id":"triangle","label":"🔺 Triangle"}],"correct_id":"circle"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_shape_patterns, 'Shape Patterns Quiz', 'Patterns with shapes!', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '⬛⭕⬛⭕⬛___ What comes next?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '⬛ Square', false, 1), (q_id, '⭕ Circle', true, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '🔺🔺⬛🔺🔺⬛🔺🔺___ What comes next?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🔺 Triangle', false, 1), (q_id, '⬛ Square', true, 2);

    -- Lesson 7.3: Complete the Pattern
    l_complete_pattern := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_complete_pattern, ch_patterns, 'Complete the Pattern', 'Practice completing different types of patterns', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_complete_pattern, 'Find the Missing Piece', tap_id, '{"prompt":"What is missing? 🚗🚌🚗🚌___","options":[{"id":"car","label":"🚗 Car"},{"id":"bus","label":"🚌 Bus"}],"correct_id":"car"}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_complete_pattern, 'Pattern Match', match_id, '{"pairs":[{"pattern":"🔴🔵🔴🔵","next":"🔴"},{"pattern":"⭕🔺⭕🔺","next":"⭕"},{"pattern":"🚗🚌🚗🚌","next":"🚗"}]}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_complete_pattern, 'Patterns Final Quiz', 'You are a pattern master!', 90, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '⭐🌙⭐🌙⭐___ What comes next?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '⭐ Star', false, 1), (q_id, '🌙 Moon', true, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '☀️🌧️☀️🌧️☀️___ What comes next?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '☀️ Sun', false, 1), (q_id, '🌧️ Rain', true, 2);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '🌸🌸🌼🌸🌸🌼🌸🌸___ What comes next?', mcq_id, 10, 3, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '🌸 Flower', false, 1), (q_id, '🌼 Daisy', true, 2);
END $$;
