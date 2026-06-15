-- ═══════════════════════════════════════════════════════════════════════════════
-- LKG ENGLISH — COMPLETE SEED DATA
-- Chapters → Lessons → Activities → Quizzes → Questions → Options
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

    -- chapter UUIDs
    ch_a       UUID := gen_random_uuid();
    ch_n       UUID := gen_random_uuid();
    ch_phonics UUID := gen_random_uuid();
    ch_words   UUID := gen_random_uuid();
    ch_rhymes  UUID := gen_random_uuid();
    ch_write   UUID := gen_random_uuid();

    -- lesson UUIDs
    l_a1 UUID; l_a2 UUID; l_a3 UUID; l_a4 UUID;
    l_n1 UUID; l_n2 UUID; l_n3 UUID; l_n4 UUID;
    l_p1 UUID; l_p2 UUID; l_p3 UUID;
    l_w1 UUID; l_w2 UUID; l_w3 UUID;
    l_r1 UUID; l_r2 UUID; l_r3 UUID;
    l_wr1 UUID; l_wr2 UUID; l_wr3 UUID;

    -- quiz & activity UUIDs (will assign inline)
    act_id UUID; quiz_id UUID; q_id UUID;
BEGIN

    -- ───────────────────────────────────────────────────────────────────────────
    -- CHAPTER 1: Alphabet A-M
    -- ───────────────────────────────────────────────────────────────────────────
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_a, subj_id, 'Alphabet A-M', 1, active_id);

    -- Lesson 1.1: Letters A B C D
    l_a1 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_a1, ch_a, 'Letters A B C D', 'Learn to identify and say letters A, B, C, D', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    -- Activity: Tracing A-D
    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_a1, 'Trace A-D', tracing_id, '{"letters":["A","B","C","D"],"color":"#FF6B35","thickness":3}', 1, active_id);

    -- Activity: Tap correct letter
    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_a1, 'Find the Letter', tap_id, '{"prompt":"Tap the letter A","options":[{"id":"A","label":"A"},{"id":"B","label":"B"},{"id":"C","label":"C"},{"id":"D","label":"D"}],"correct_id":"A"}', 2, active_id);

    -- Quiz 1.1: A-D
    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_a1, 'Alphabet A-D Quiz', 'Let us check what you learned about A, B, C, D', 60, easy_id, 1, active_id);

    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter comes after A?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'A', false, 1), (q_id, 'B', true, 2), (q_id, 'C', false, 3);

    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter starts the word "Cat"?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'A', false, 1), (q_id, 'B', false, 2), (q_id, 'C', true, 3);

    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Find letter D', image_sel_id, 10, 3, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'A', false, 1), (q_id, 'B', false, 2), (q_id, 'D', true, 3);

    -- Lesson 1.2: Letters E F G H
    l_a2 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_a2, ch_a, 'Letters E F G H', 'Learn to identify and say letters E, F, G, H', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_a2, 'Trace E-H', tracing_id, '{"letters":["E","F","G","H"],"color":"#22C55E","thickness":3}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_a2, 'Alphabet E-H Quiz', 'Test your knowledge of letters E, F, G, H', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter comes after E?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'D', false, 1), (q_id, 'F', true, 2), (q_id, 'G', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter is in "Fish"?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'E', false, 1), (q_id, 'F', true, 2), (q_id, 'H', false, 3);

    -- Lesson 1.3: Letters I J K L
    l_a3 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_a3, ch_a, 'Letters I J K L', 'Learn to identify and say letters I, J, K, L', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_a3, 'Trace I-L', tracing_id, '{"letters":["I","J","K","L"],"color":"#6366F1","thickness":3}', 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_a3, 'Match Uppercase-Lowercase', drag_drop_id, '{"pairs":[{"upper":"I","lower":"i"},{"upper":"J","lower":"j"},{"upper":"K","lower":"k"},{"upper":"L","lower":"l"}]}', 2, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_a3, 'Alphabet I-L Quiz', 'Letters I, J, K, L fun quiz', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter is after K?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'J', false, 1), (q_id, 'K', false, 2), (q_id, 'L', true, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter starts "Jug"?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'I', false, 1), (q_id, 'J', true, 2), (q_id, 'K', false, 3);

    -- Lesson 1.4: Letter M
    l_a4 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_a4, ch_a, 'Letter M & Review A-M', 'Review all letters from A to M', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 4, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_a4, 'Alphabet A-M Review Quiz', 'Complete review of letters A to M', 120, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How many letters from A to M?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '10', false, 1), (q_id, '12', false, 2), (q_id, '13', true, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter is 5th in the alphabet?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'A', false, 1), (q_id, 'E', true, 2), (q_id, 'M', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter comes before M?', mcq_id, 10, 3, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'L', true, 1), (q_id, 'N', false, 2), (q_id, 'K', false, 3);

    -- ───────────────────────────────────────────────────────────────────────────
    -- CHAPTER 2: Alphabet N-Z
    -- ───────────────────────────────────────────────────────────────────────────
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_n, subj_id, 'Alphabet N-Z', 2, active_id);

    -- Lesson 2.1: Letters N O P Q
    l_n1 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_n1, ch_n, 'Letters N O P Q', 'Learn letters N, O, P, Q', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_n1, 'Trace N-Q', tracing_id, '{"letters":["N","O","P","Q"],"color":"#F59E0B","thickness":3}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_n1, 'Alphabet N-Q Quiz', 'Quiz on letters N, O, P, Q', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter comes after N?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'M', false, 1), (q_id, 'O', true, 2), (q_id, 'P', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter is in "Queen"?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'N', false, 1), (q_id, 'O', false, 2), (q_id, 'Q', true, 3);

    -- Lesson 2.2: Letters R S T U
    l_n2 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_n2, ch_n, 'Letters R S T U', 'Learn letters R, S, T, U', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_n2, 'Trace R-U', tracing_id, '{"letters":["R","S","T","U"],"color":"#EC4899","thickness":3}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_n2, 'Alphabet R-U Quiz', 'Quiz on letters R, S, T, U', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter comes after S?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'R', false, 1), (q_id, 'T', true, 2), (q_id, 'U', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter starts "Sun"?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'R', false, 1), (q_id, 'S', true, 2), (q_id, 'T', false, 3);

    -- Lesson 2.3: Letters V W X Y Z
    l_n3 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_n3, ch_n, 'Letters V W X Y Z', 'Learn letters V, W, X, Y, Z', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_n3, 'Trace V-Z', tracing_id, '{"letters":["V","W","X","Y","Z"],"color":"#8B5CF6","thickness":3}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_n3, 'Alphabet V-Z Quiz', 'Quiz on letters V to Z', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which is the last letter of the alphabet?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'X', false, 1), (q_id, 'Y', false, 2), (q_id, 'Z', true, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter comes after V?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'U', false, 1), (q_id, 'W', true, 2), (q_id, 'X', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter starts "Yak"?', mcq_id, 10, 3, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'V', false, 1), (q_id, 'W', false, 2), (q_id, 'Y', true, 3);

    -- Lesson 2.4: Full Alphabet Song & Review
    l_n4 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_n4, ch_n, 'Alphabet Song & Review N-Z', 'Sing the alphabet song and review N to Z', 'hq3yfQnllfQ', 'https://img.youtube.com/vi/hq3yfQnllfQ/hqdefault.jpg', 180, 4, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_n4, 'Alphabet Drag & Drop', drag_drop_id, '{"items":["N","O","P","Q","R","S","T","U","V","W","X","Y","Z"],"targets":["Letters in order"]}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_n4, 'Full Alphabet N-Z Review', 'Review all letters from N to Z', 120, medium_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter comes after P?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'O', false, 1), (q_id, 'Q', true, 2), (q_id, 'R', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How many letters in the alphabet?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '24', false, 1), (q_id, '25', false, 2), (q_id, '26', true, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter comes before Z?', mcq_id, 10, 3, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'X', false, 1), (q_id, 'Y', true, 2), (q_id, 'Z', false, 3);

    -- ───────────────────────────────────────────────────────────────────────────
    -- CHAPTER 3: Phonics - Letter Sounds
    -- ───────────────────────────────────────────────────────────────────────────
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_phonics, subj_id, 'Phonics - Letter Sounds', 3, active_id);

    -- Lesson 3.1: Phonics A E I O U
    l_p1 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_p1, ch_phonics, 'Vowel Sounds - A E I O U', 'Learn the short vowel sounds of A, E, I, O, U', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_p1, 'Vowel Sound Match', match_id, '{"pairs":[{"sound":"A as in Apple","letter":"A"},{"sound":"E as in Egg","letter":"E"},{"sound":"I as in Igloo","letter":"I"},{"sound":"O as in Owl","letter":"O"},{"sound":"U as in Umbrella","letter":"U"}]}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_p1, 'Vowel Sounds Quiz', 'Identify vowel sounds', 90, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which word starts with the letter A?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Ball', false, 1), (q_id, 'Apple', true, 2), (q_id, 'Cat', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which word starts with the letter E?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Egg', true, 1), (q_id, 'Fish', false, 2), (q_id, 'Dog', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which word has the letter I?', mcq_id, 10, 3, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Igloo', true, 1), (q_id, 'Van', false, 2), (q_id, 'Zoo', false, 3);

    -- Lesson 3.2: Consonant Sounds B C D F G
    l_p2 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_p2, ch_phonics, 'Consonant Sounds - B C D F G', 'Learn consonant sounds B, C, D, F, G', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_p2, 'Tap the Sound', tap_id, '{"prompt":"Tap the letter that says /b/","options":[{"id":"B","label":"B"},{"id":"D","label":"D"},{"id":"F","label":"F"},{"id":"G","label":"G"}],"correct_id":"B"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_p2, 'Consonant Sounds Quiz', 'Identify consonant sounds', 90, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which word starts like "Ball"?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Cat', false, 1), (q_id, 'Dog', false, 2), (q_id, 'Bat', true, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which word starts like "Car"?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Cat', true, 1), (q_id, 'Fan', false, 2), (q_id, 'Goat', false, 3);

    -- Lesson 3.3: Phonics Blending
    l_p3 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_p3, ch_phonics, 'Blending Sounds', 'Learn to blend sounds to make simple words', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 180, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_p3, 'Build a Word', drag_drop_id, '{"pairs":[{"sounds":["c","a","t"],"word":"cat"},{"sounds":["d","o","g"],"word":"dog"},{"sounds":["b","a","t"],"word":"bat"}]}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_p3, 'Blending Quiz', 'Blend sounds to read words', 120, medium_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'c + a + t = ?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Car', false, 1), (q_id, 'Cat', true, 2), (q_id, 'Cow', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'd + o + g = ?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Dot', false, 1), (q_id, 'Doll', false, 2), (q_id, 'Dog', true, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'b + a + t = ?', mcq_id, 10, 3, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Bat', true, 1), (q_id, 'Bun', false, 2), (q_id, 'Bag', false, 3);

    -- ───────────────────────────────────────────────────────────────────────────
    -- CHAPTER 4: Sight Words
    -- ───────────────────────────────────────────────────────────────────────────
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_words, subj_id, 'Sight Words', 4, active_id);

    -- Lesson 4.1: I, a, the, is, in
    l_w1 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_w1, ch_words, 'Sight Words - I, a, the, is, in', 'Read and recognize common sight words', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_w1, 'Find the Sight Word', tap_id, '{"prompt":"Tap the word: the","options":[{"id":"a","label":"a"},{"id":"the","label":"the"},{"id":"is","label":"is"},{"id":"in","label":"in"}],"correct_id":"the"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_w1, 'Sight Words 1 Quiz', 'Find the correct sight word', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '___ cat is sleeping. Which word fits?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'a', false, 1), (q_id, 'The', true, 2), (q_id, 'in', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'The ball ___ red. Which word fits?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'a', false, 1), (q_id, 'the', false, 2), (q_id, 'is', true, 3);

    -- Lesson 4.2: it, at, on, up, an
    l_w2 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_w2, ch_words, 'Sight Words - it, at, on, up, an', 'Read sight words it, at, on, up, an', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_w2, 'Match Sight Words', match_id, '{"pairs":[{"word":"it","sentence":"__ is a dog"},{"word":"on","sentence":"The cat is __ the mat"},{"word":"up","sentence":"Stand __"},{"word":"an","sentence":"__ apple"}]}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_w2, 'Sight Words 2 Quiz', 'More sight word practice', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'The cat is ___ the mat. Which word?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'in', false, 1), (q_id, 'on', true, 2), (q_id, 'up', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, '___ apple a day. Which word?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'A', false, 1), (q_id, 'An', true, 2), (q_id, 'The', false, 3);

    -- Lesson 4.3: to, for, and, can, see
    l_w3 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_w3, ch_words, 'Sight Words - to, for, and, can, see', 'Learn to read common words', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 120, 3, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_w3, 'Sight Words Review', 'Review all sight words learned', 90, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'I ___ see the stars. Which word?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'to', false, 1), (q_id, 'can', true, 2), (q_id, 'for', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Mom ___ Dad love me. Which word?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'and', true, 1), (q_id, 'for', false, 2), (q_id, 'the', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'This gift is ___ you. Which word?', mcq_id, 10, 3, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'to', false, 1), (q_id, 'for', true, 2), (q_id, 'and', false, 3);

    -- ───────────────────────────────────────────────────────────────────────────
    -- CHAPTER 5: Nursery Rhymes
    -- ───────────────────────────────────────────────────────────────────────────
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_rhymes, subj_id, 'Nursery Rhymes', 5, active_id);

    -- Lesson 5.1: Twinkle Twinkle Little Star
    l_r1 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_r1, ch_rhymes, 'Twinkle Twinkle Little Star', 'Sing along with Twinkle Twinkle Little Star', 'yCjJyiqpAuU', 'https://img.youtube.com/vi/yCjJyiqpAuU/hqdefault.jpg', 180, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_r1, 'Tap the Rhyming Word', tap_id, '{"prompt":"Which word rhymes with Star?","options":[{"id":"car","label":"Car"},{"id":"far","label":"Far"},{"id":"ball","label":"Ball"},{"id":"dog","label":"Dog"}],"correct_id":"far"}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_r1, 'Twinkle Twinkle Quiz', 'Rhyming words from the rhyme', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Twinkle twinkle little ___?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'moon', false, 1), (q_id, 'star', true, 2), (q_id, 'sun', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How I wonder what you ___?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'are', true, 1), (q_id, 'see', false, 2), (q_id, 'do', false, 3);

    -- Lesson 5.2: ABC Song
    l_r2 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_r2, ch_rhymes, 'ABC Song', 'Sing the classic ABC song', 'hq3yfQnllfQ', 'https://img.youtube.com/vi/hq3yfQnllfQ/hqdefault.jpg', 180, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_r2, 'ABC Order Drag', drag_drop_id, '{"items":["A","B","C","D","E","F","G"],"targets":["Alphabetical order"]}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_r2, 'ABC Song Quiz', 'Test your ABC knowledge', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'ABCD ___?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'E', false, 1), (q_id, 'F', true, 2), (q_id, 'G', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'HIJK ___?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'LMN', true, 1), (q_id, 'OPQ', false, 2), (q_id, 'RST', false, 3);

    -- Lesson 5.3: Old MacDonald Had a Farm
    l_r3 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_r3, ch_rhymes, 'Old MacDonald Had a Farm', 'Sing about farm animals and their sounds', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 200, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_r3, 'Animal Sounds Match', match_id, '{"pairs":[{"animal":"Cow","sound":"Moo"},{"animal":"Pig","sound":"Oink"},{"animal":"Duck","sound":"Quack"},{"animal":"Sheep","sound":"Baa"}]}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_r3, 'Old MacDonald Quiz', 'Farm animal sounds quiz', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'What does a cow say?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Moo', true, 1), (q_id, 'Baa', false, 2), (q_id, 'Quack', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'What does a duck say?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Oink', false, 1), (q_id, 'Moo', false, 2), (q_id, 'Quack', true, 3);

    -- ───────────────────────────────────────────────────────────────────────────
    -- CHAPTER 6: Pre-Writing & Basic Words
    -- ───────────────────────────────────────────────────────────────────────────
    INSERT INTO chapters (id, subject_id, name, sort_order, status_id)
    VALUES (ch_write, subj_id, 'Pre-Writing & Basic Words', 6, active_id);

    -- Lesson 6.1: Tracing Lines & Shapes
    l_wr1 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_wr1, ch_write, 'Tracing Lines & Shapes', 'Practice tracing lines, curves and basic shapes', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 150, 1, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_wr1, 'Trace Lines', tracing_id, '{"shapes":["line","curve","circle","square","triangle"],"color":"#FF6B35","thickness":4}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_wr1, 'Shapes Recognition', 'Identify basic shapes', 60, easy_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which shape is round?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Square', false, 1), (q_id, 'Circle', true, 2), (q_id, 'Triangle', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'How many sides does a triangle have?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, '2', false, 1), (q_id, '3', true, 2), (q_id, '4', false, 3);

    -- Lesson 6.2: Writing Letters A-M
    l_wr2 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_wr2, ch_write, 'Writing Letters A-M', 'Trace and write uppercase letters A to M', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 180, 2, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_wr2, 'Write A-M', tracing_id, '{"letters":["A","B","C","D","E","F","G","H","I","J","K","L","M"],"color":"#22C55E","thickness":3}', 1, active_id);

    -- Lesson 6.3: Writing Letters N-Z
    l_wr3 := gen_random_uuid();
    INSERT INTO lessons (id, chapter_id, title, description, youtube_video_id, thumbnail_url, duration_seconds, sort_order, status_id)
    VALUES (l_wr3, ch_write, 'Writing Letters N-Z', 'Trace and write uppercase letters N to Z', 'Z0PzUJ1x1Mw', 'https://img.youtube.com/vi/Z0PzUJ1x1Mw/hqdefault.jpg', 180, 3, active_id);

    act_id := gen_random_uuid();
    INSERT INTO activities (id, lesson_id, name, activity_type_id, config, sort_order, status_id)
    VALUES (act_id, l_wr3, 'Write N-Z', tracing_id, '{"letters":["N","O","P","Q","R","S","T","U","V","W","X","Y","Z"],"color":"#6366F1","thickness":3}', 1, active_id);

    quiz_id := gen_random_uuid();
    INSERT INTO quizzes (id, lesson_id, title, description, time_limit_seconds, difficulty_id, sort_order, status_id)
    VALUES (quiz_id, l_wr3, 'Complete Alphabet Writing Quiz', 'Show what you learned about writing', 120, medium_id, 1, active_id);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter is first?', mcq_id, 10, 1, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'A', true, 1), (q_id, 'B', false, 2), (q_id, 'C', false, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter is last?', mcq_id, 10, 2, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'Y', false, 1), (q_id, 'X', false, 2), (q_id, 'Z', true, 3);
    q_id := gen_random_uuid();
    INSERT INTO quiz_questions (id, quiz_id, question_text, question_type_id, points, sort_order, status_id)
    VALUES (q_id, quiz_id, 'Which letter comes after M?', mcq_id, 10, 3, active_id);
    INSERT INTO quiz_options (question_id, option_text, is_correct, sort_order) VALUES (q_id, 'L', false, 1), (q_id, 'N', true, 2), (q_id, 'O', false, 3);

END $$;
