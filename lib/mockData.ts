import type { GenerateData } from "@/types";

export const mockGenerateData: GenerateData = {
  course_analysis: {
    course_title: "Unit 1: My School Day",
    grade: "小学五年级",
    topic: "Daily school schedule",
    teaching_objectives: [
      "Students can ask and answer questions about school time.",
      "Students can use key vocabulary to describe school subjects.",
      "Students can use simple present tense to talk about daily routines."
    ],
    key_vocabulary: [
      "school",
      "classroom",
      "subject",
      "English",
      "math",
      "music",
      "timetable"
    ],
    key_sentences: [
      "What time do you go to school?",
      "I go to school at 8:00.",
      "What subjects do you have today?"
    ],
    grammar_points: [
      "What time do you ...?",
      "I do something at + time.",
      "Simple present tense"
    ],
    content_summary:
      "本节课围绕学生日常上学时间和课程安排展开，帮助学生掌握时间表达、课程科目表达和一般现在时。"
  },
  generated_questions: [
    {
      question_id: "Q001",
      question_type: "选择题",
      knowledge_point: "What time do you ...?",
      difficulty: "简单",
      question: "What time do you go to school?",
      options: [
        "A. I go to school at 8:00.",
        "B. I am school.",
        "C. I school go.",
        "D. I has school."
      ],
      answer: "A",
      explanation: "表达几点去上学时，应使用 go to school at + 时间。",
      student_hint: "注意 at 后面可以接具体时间。"
    },
    {
      question_id: "Q002",
      question_type: "选择题",
      knowledge_point: "School subjects",
      difficulty: "简单",
      question: "Which word is a school subject?",
      options: ["A. English", "B. Morning", "C. Classroom", "D. Timetable"],
      answer: "A",
      explanation: "English 是课程科目，其他选项不是具体学科。",
      student_hint: "想一想你每天上的课程名称。"
    }
  ],
  audit_result: [
    {
      question_id: "Q001",
      audit_status: "通过",
      issue_type: "无",
      audit_reason: "题干清晰，答案唯一，选项差异明显，难度符合小学五年级。",
      revision_suggestion: "无"
    },
    {
      question_id: "Q002",
      audit_status: "通过",
      issue_type: "无",
      audit_reason: "题目围绕学校科目词汇展开，选项设计合理，答案明确。",
      revision_suggestion: "无"
    }
  ],
  raw: {
    source: "mock",
    topic: "Unit 1: My School Day"
  }
};
