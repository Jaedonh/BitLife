export interface MajorDef {
  id: string;
  name: string;
  /** Minimum Smarts to be admitted. */
  minSmarts: number;
  /** Yearly tuition in USD (scaled by country). */
  tuition: number;
  years: number;
  /** Job categories this degree feeds. */
  categories: string[];
}

export const MAJORS: readonly MajorDef[] = [
  { id: 'business', name: 'Business', minSmarts: 35, tuition: 14000, years: 4, categories: ['office', 'finance'] },
  { id: 'computer_science', name: 'Computer Science', minSmarts: 55, tuition: 15000, years: 4, categories: ['tech', 'science'] },
  { id: 'nursing', name: 'Nursing', minSmarts: 45, tuition: 13000, years: 4, categories: ['health'] },
  { id: 'biology', name: 'Biology', minSmarts: 50, tuition: 13000, years: 4, categories: ['science', 'health'] },
  { id: 'chemistry', name: 'Chemistry', minSmarts: 55, tuition: 13000, years: 4, categories: ['science'] },
  { id: 'psychology', name: 'Psychology', minSmarts: 40, tuition: 12000, years: 4, categories: ['health', 'education'] },
  { id: 'education', name: 'Education', minSmarts: 35, tuition: 11000, years: 4, categories: ['education'] },
  { id: 'english', name: 'English', minSmarts: 35, tuition: 11000, years: 4, categories: ['creative', 'education'] },
  { id: 'history', name: 'History', minSmarts: 35, tuition: 11000, years: 4, categories: ['education', 'public'] },
  { id: 'political_science', name: 'Political Science', minSmarts: 45, tuition: 12000, years: 4, categories: ['public', 'law'] },
  { id: 'economics', name: 'Economics', minSmarts: 50, tuition: 14000, years: 4, categories: ['finance', 'office'] },
  { id: 'finance', name: 'Finance', minSmarts: 50, tuition: 14000, years: 4, categories: ['finance'] },
  { id: 'accounting', name: 'Accounting', minSmarts: 45, tuition: 13000, years: 4, categories: ['finance', 'office'] },
  { id: 'engineering', name: 'Engineering', minSmarts: 60, tuition: 16000, years: 4, categories: ['tech', 'science', 'trade'] },
  { id: 'architecture', name: 'Architecture', minSmarts: 55, tuition: 15000, years: 5, categories: ['creative', 'trade'] },
  { id: 'graphic_design', name: 'Graphic Design', minSmarts: 30, tuition: 12000, years: 4, categories: ['creative'] },
  { id: 'fine_arts', name: 'Fine Arts', minSmarts: 25, tuition: 12000, years: 4, categories: ['creative'] },
  { id: 'music', name: 'Music', minSmarts: 25, tuition: 12000, years: 4, categories: ['creative'] },
  { id: 'journalism', name: 'Journalism', minSmarts: 40, tuition: 12000, years: 4, categories: ['creative', 'public'] },
  { id: 'communications', name: 'Communications', minSmarts: 30, tuition: 11000, years: 4, categories: ['office', 'creative'] },
  { id: 'marketing', name: 'Marketing', minSmarts: 35, tuition: 13000, years: 4, categories: ['office'] },
  { id: 'criminal_justice', name: 'Criminal Justice', minSmarts: 35, tuition: 11000, years: 4, categories: ['public', 'law'] },
  { id: 'mathematics', name: 'Mathematics', minSmarts: 60, tuition: 13000, years: 4, categories: ['science', 'finance', 'tech'] },
  { id: 'physics', name: 'Physics', minSmarts: 65, tuition: 13000, years: 4, categories: ['science'] },
  { id: 'sports_science', name: 'Sports Science', minSmarts: 30, tuition: 11000, years: 4, categories: ['sports', 'health'] },
];

export const MAJOR_BY_ID: Record<string, MajorDef> = Object.fromEntries(MAJORS.map((m) => [m.id, m]));

export interface GraduateProgramDef {
  id: string;
  name: string;
  degree: 'master' | 'doctor';
  minSmarts: number;
  tuition: number;
  years: number;
  /** Bachelor majors accepted (empty = any). */
  requiresMajors: string[];
  grants: string;
}

export const GRADUATE_PROGRAMS: readonly GraduateProgramDef[] = [
  { id: 'medical_school', name: 'Medical School', degree: 'doctor', minSmarts: 75, tuition: 45000, years: 4, requiresMajors: ['biology', 'chemistry', 'nursing', 'psychology'], grants: 'doctor:medicine' },
  { id: 'law_school', name: 'Law School', degree: 'doctor', minSmarts: 65, tuition: 40000, years: 3, requiresMajors: ['political_science', 'history', 'english', 'criminal_justice', 'business', 'economics', 'communications', 'psychology'], grants: 'doctor:law' },
  { id: 'mba', name: 'Business School (MBA)', degree: 'master', minSmarts: 50, tuition: 35000, years: 2, requiresMajors: [], grants: 'master:business' },
  { id: 'masters', name: "Master's Degree", degree: 'master', minSmarts: 55, tuition: 20000, years: 2, requiresMajors: [], grants: 'master:general' },
  { id: 'phd', name: 'PhD', degree: 'doctor', minSmarts: 75, tuition: 8000, years: 5, requiresMajors: [], grants: 'doctor:philosophy' },
  { id: 'dental_school', name: 'Dental School', degree: 'doctor', minSmarts: 70, tuition: 42000, years: 4, requiresMajors: ['biology', 'chemistry', 'nursing'], grants: 'doctor:dentistry' },
];

export const GRAD_BY_ID: Record<string, GraduateProgramDef> = Object.fromEntries(GRADUATE_PROGRAMS.map((g) => [g.id, g]));
