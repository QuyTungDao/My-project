package tungdao.com.project1.entity;

public enum QuestionType {
    // Reading/Listening basic types
    MCQ,
    MATCHING,
    FILL_IN_THE_BLANK,
    TRUE_FALSE_NOT_GIVEN,
    SHORT_ANSWER,

    // Writing types (specific tasks)
    ESSAY,
    WRITING_TASK1_ACADEMIC,
    WRITING_TASK1_GENERAL,
    WRITING_TASK2,

    // Speaking types (specific parts)
    SPEAKING_TASK,
    SPEAKING_PART1,
    SPEAKING_PART2,
    SPEAKING_PART3,

    // Listening specialized types
    NOTE_COMPLETION,
    FORM_FILLING,
    TABLE_COMPLETION,
    PLAN_MAP_COMPLETION,
    SENTENCE_COMPLETION,
    SUMMARY_COMPLETION,
    DIAGRAM_LABELLING,
    FLEXIBLE_CONTEXT
}