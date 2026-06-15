import { LucideIcon } from 'lucide-react';

export interface QuizOption {
  n: string;
  e: string;
}

export interface LessonQuiz {
  question: string;
  options: QuizOption[];
  correct: string;
}

export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  color: string;
  text: string;
  border: string;
  status: 'completed' | 'in-progress' | 'not-started';
  quiz: LessonQuiz;
}

export interface Category {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  border: string;
  progress: number;
  lessons: number;
}
