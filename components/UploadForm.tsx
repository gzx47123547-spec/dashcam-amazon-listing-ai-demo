"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { formatFileSize } from "@/lib/utils";

export type UploadFormValues = {
  grade: string;
  course_type: string;
  question_type: string;
  difficulty: string;
  question_count: number;
  course_file: File | null;
  mock: boolean;
};

type UploadFormProps = {
  isLoading: boolean;
  forceMock: boolean;
  onForceMockChange: (value: boolean) => void;
  onGenerate: (values: UploadFormValues) => void;
};

const gradeOptions = ["小学三年级", "小学四年级", "小学五年级", "小学六年级", "初一", "初二"];
const courseTypeOptions = ["新授课", "复习课", "练习课", "测评课"];
const questionTypeOptions = ["选择题", "填空题", "口语练习", "阅读理解"];
const difficultyOptions = ["简单", "中等", "较难"];

export function UploadForm({
  isLoading,
  forceMock,
  onForceMockChange,
  onGenerate
}: UploadFormProps) {
  const [grade, setGrade] = useState("小学五年级");
  const [courseType, setCourseType] = useState("新授课");
  const [questionType, setQuestionType] = useState("选择题");
  const [difficulty, setDifficulty] = useState("简单");
  const [questionCount, setQuestionCount] = useState(5);
  const [courseFile, setCourseFile] = useState<File | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setCourseFile(event.target.files?.[0] ?? null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onGenerate({
      grade,
      course_type: courseType,
      question_type: questionType,
      difficulty,
      question_count: questionCount,
      course_file: courseFile,
      mock: forceMock
    });
  }

  return (
    <form className="card p-5" onSubmit={handleSubmit}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="panel-title">输入配置</h2>
          <p className="small-muted">课程参数与课件文件</p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
          <input
            checked={forceMock}
            className="h-4 w-4 accent-blue-600"
            disabled={isLoading}
            type="checkbox"
            onChange={(event) => onForceMockChange(event.target.checked)}
          />
          Mock 演示
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <SelectField label="年级" value={grade} options={gradeOptions} onChange={setGrade} />
        <SelectField
          label="课程类型"
          value={courseType}
          options={courseTypeOptions}
          onChange={setCourseType}
        />
        <SelectField
          label="题型"
          value={questionType}
          options={questionTypeOptions}
          onChange={setQuestionType}
        />
        <SelectField
          label="难度"
          value={difficulty}
          options={difficultyOptions}
          onChange={setDifficulty}
        />
      </div>

      <label className="mt-4 grid gap-2">
        <span className="field-label">题目数量</span>
        <input
          className="field-control"
          disabled={isLoading}
          max={10}
          min={1}
          type="number"
          value={questionCount}
          onChange={(event) => setQuestionCount(Number(event.target.value))}
        />
      </label>

      <label className="mt-4 grid gap-2">
        <span className="field-label">上传课件</span>
        <input
          accept=".pdf,.docx,.pptx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
          className="block w-full rounded-lg border border-dashed border-blue-200 bg-blue-50 px-3 py-5 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
          disabled={isLoading}
          type="file"
          onChange={handleFileChange}
        />
      </label>

      <div className="mt-3 min-h-12 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        {courseFile ? (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-slate-800">{courseFile.name}</span>
            <span>{formatFileSize(courseFile.size)}</span>
          </div>
        ) : (
          <span>尚未选择课件文件</span>
        )}
      </div>

      <button
        className="mt-5 h-12 w-full rounded-lg bg-blue-600 px-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "AI正在处理课件..." : "开始生成"}
      </button>
    </form>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="grid gap-2">
      <span className="field-label">{label}</span>
      <select
        className="field-control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
