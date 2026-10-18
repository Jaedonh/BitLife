import type { JobCategory } from '@/engine/types';

export type EducationRequirement = 'none' | 'high_school' | 'bachelor' | 'master' | 'doctor:medicine' | 'doctor:law' | 'doctor:dentistry' | 'doctor';

export interface JobRequirements {
  education: EducationRequirement;
  /** Accepted bachelor majors (any if empty). */
  majors?: string[];
  minSmarts?: number;
  minLooks?: number;
  minHealth?: number;
  /** Years of experience in this category. */
  experience?: number;
  noRecord?: boolean;
  minAge?: number;
  trait?: string;
}

export interface JobDef {
  id: string;
  category: JobCategory;
  /** Ladder of titles and base yearly USD salaries, entry first. */
  ladder: { title: string; salary: number }[];
  requirements: JobRequirements;
  partTime?: boolean;
  /** 0-100 yearly toll on health/happiness. */
  stress: number;
  /** 0-100 danger: chance of injury events. */
  danger: number;
  /** Public-facing jobs raise fame slowly. */
  fame?: number;
  hoursPerWeek: number;
  emoji: string;
}

const j = (id: string, category: JobCategory, emoji: string, ladder: [string, number][], requirements: JobRequirements, extra: Partial<JobDef> = {}): JobDef => ({
  id,
  category,
  emoji,
  ladder: ladder.map(([title, salary]) => ({ title, salary })),
  requirements,
  stress: 30,
  danger: 2,
  hoursPerWeek: 40,
  ...extra,
});

export const JOBS: readonly JobDef[] = [
  // Part-time (teens)
  j('pt_cashier', 'service', '🛒', [['Cashier', 11000]], { education: 'none', minAge: 15 }, { partTime: true, hoursPerWeek: 15, stress: 15 }),
  j('pt_babysitter', 'service', '🍼', [['Babysitter', 9000]], { education: 'none', minAge: 14 }, { partTime: true, hoursPerWeek: 10, stress: 15 }),
  j('pt_lifeguard', 'service', '🏊', [['Lifeguard', 10000]], { education: 'none', minAge: 16, minHealth: 50 }, { partTime: true, hoursPerWeek: 15, stress: 15 }),
  j('pt_barista', 'service', '☕', [['Barista', 12000]], { education: 'none', minAge: 16 }, { partTime: true, hoursPerWeek: 18, stress: 20 }),
  j('pt_tutor', 'education', '📝', [['Tutor', 10000]], { education: 'none', minAge: 15, minSmarts: 55 }, { partTime: true, hoursPerWeek: 8, stress: 10 }),
  j('pt_delivery', 'service', '🚲', [['Delivery Rider', 13000]], { education: 'none', minAge: 16 }, { partTime: true, hoursPerWeek: 15, stress: 20, danger: 8 }),
  // Service / no requirements
  j('janitor', 'service', '🧹', [['Janitor', 26000], ['Head Janitor', 32000], ['Facilities Supervisor', 41000]], { education: 'none' }, { stress: 20 }),
  j('fast_food', 'service', '🍔', [['Fast Food Worker', 24000], ['Shift Lead', 29000], ['Restaurant Manager', 42000], ['Regional Manager', 68000]], { education: 'none' }, { stress: 35 }),
  j('retail', 'service', '👕', [['Sales Associate', 26000], ['Senior Associate', 31000], ['Store Manager', 48000], ['District Manager', 75000]], { education: 'none' }, { stress: 30 }),
  j('waiter', 'service', '🍽️', [['Waiter', 25000], ['Head Waiter', 33000], ['Restaurant Manager', 46000]], { education: 'none', minLooks: 20 }, { stress: 35 }),
  j('warehouse', 'service', '📦', [['Warehouse Associate', 30000], ['Forklift Operator', 38000], ['Warehouse Supervisor', 52000], ['Logistics Manager', 72000]], { education: 'none', minHealth: 40 }, { stress: 30, danger: 10 }),
  j('driver', 'service', '🚚', [['Delivery Driver', 34000], ['Truck Driver', 52000], ['Senior Driver', 62000], ['Fleet Manager', 78000]], { education: 'none', minAge: 21, noRecord: true }, { stress: 35, danger: 12 }),
  j('security', 'service', '🛡️', [['Security Guard', 31000], ['Senior Guard', 38000], ['Security Supervisor', 50000], ['Head of Security', 72000]], { education: 'none', noRecord: true, minHealth: 40 }, { stress: 30, danger: 10 }),
  j('bartender', 'service', '🍸', [['Barback', 24000], ['Bartender', 36000], ['Bar Manager', 52000]], { education: 'none', minAge: 21 }, { stress: 35 }),
  j('hairdresser', 'service', '💇', [['Junior Stylist', 25000], ['Stylist', 36000], ['Senior Stylist', 48000], ['Salon Owner', 70000]], { education: 'none', minLooks: 40 }, { stress: 25 }),
  j('fitness_trainer', 'sports', '🏋️', [['Gym Assistant', 24000], ['Personal Trainer', 40000], ['Head Trainer', 58000], ['Gym Owner', 85000]], { education: 'none', minHealth: 70 }, { stress: 20, danger: 5 }),
  // Trades
  j('electrician', 'trade', '⚡', [['Apprentice Electrician', 34000], ['Electrician', 56000], ['Master Electrician', 76000], ['Electrical Contractor', 105000]], { education: 'high_school', minSmarts: 35 }, { stress: 30, danger: 20 }),
  j('plumber', 'trade', '🔧', [['Apprentice Plumber', 33000], ['Plumber', 55000], ['Master Plumber', 74000], ['Plumbing Contractor', 100000]], { education: 'high_school' }, { stress: 30, danger: 12 }),
  j('carpenter', 'trade', '🪚', [['Apprentice Carpenter', 31000], ['Carpenter', 48000], ['Master Carpenter', 65000], ['Building Contractor', 95000]], { education: 'high_school' }, { stress: 30, danger: 18 }),
  j('mechanic', 'trade', '🔩', [['Apprentice Mechanic', 30000], ['Mechanic', 46000], ['Master Mechanic', 62000], ['Shop Owner', 90000]], { education: 'high_school' }, { stress: 30, danger: 12 }),
  j('chef', 'trade', '👨‍🍳', [['Line Cook', 28000], ['Sous Chef', 42000], ['Head Chef', 65000], ['Executive Chef', 95000]], { education: 'high_school' }, { stress: 45, danger: 10 }),
  j('construction', 'trade', '🏗️', [['Laborer', 30000], ['Site Worker', 40000], ['Foreman', 60000], ['Site Manager', 85000]], { education: 'none', minHealth: 50 }, { stress: 40, danger: 25 }),
  // Public
  j('police', 'public', '👮', [['Police Cadet', 42000], ['Police Officer', 58000], ['Detective', 76000], ['Lieutenant', 92000], ['Police Chief', 125000]], { education: 'high_school', noRecord: true, minHealth: 50, minAge: 21 }, { stress: 50, danger: 30 }),
  j('firefighter', 'public', '🚒', [['Probationary Firefighter', 40000], ['Firefighter', 55000], ['Fire Lieutenant', 70000], ['Fire Captain', 88000], ['Fire Chief', 115000]], { education: 'high_school', minHealth: 60, noRecord: true }, { stress: 45, danger: 35 }),
  j('military', 'public', '🎖️', [['Private', 25000], ['Corporal', 32000], ['Sergeant', 44000], ['Lieutenant', 62000], ['Major', 90000], ['Colonel', 130000]], { education: 'high_school', minHealth: 55, noRecord: true, minAge: 18 }, { stress: 50, danger: 40 }),
  j('mail_carrier', 'public', '📬', [['Mail Clerk', 34000], ['Mail Carrier', 46000], ['Postmaster', 68000]], { education: 'high_school', noRecord: true }, { stress: 20, danger: 5 }),
  j('civil_servant', 'public', '🏛️', [['Clerk', 36000], ['Administrative Officer', 48000], ['Senior Officer', 65000], ['Department Director', 110000]], { education: 'bachelor' }, { stress: 25 }),
  j('politician', 'public', '🗳️', [['Campaign Aide', 32000], ['City Councilor', 60000], ['Mayor', 110000], ['Member of Parliament', 175000], ['Minister', 250000]], { education: 'bachelor', majors: ['political_science', 'law', 'economics', 'history', 'communications', 'business'], noRecord: true, minSmarts: 55 }, { stress: 50, fame: 3 }),
  // Office
  j('receptionist', 'office', '📞', [['Receptionist', 29000], ['Office Coordinator', 38000], ['Office Manager', 55000]], { education: 'high_school' }, { stress: 20 }),
  j('admin', 'office', '🗂️', [['Administrative Assistant', 33000], ['Executive Assistant', 48000], ['Operations Manager', 72000], ['Director of Operations', 115000]], { education: 'high_school', minSmarts: 35 }, { stress: 30 }),
  j('sales', 'office', '📈', [['Sales Representative', 38000], ['Account Executive', 62000], ['Sales Manager', 95000], ['VP of Sales', 170000]], { education: 'high_school', minLooks: 35 }, { stress: 45 }),
  j('hr', 'office', '🤝', [['HR Assistant', 36000], ['HR Generalist', 55000], ['HR Manager', 85000], ['Chief People Officer', 165000]], { education: 'bachelor' }, { stress: 30 }),
  j('marketing', 'office', '📣', [['Marketing Coordinator', 40000], ['Marketing Specialist', 58000], ['Marketing Manager', 90000], ['Marketing Director', 140000], ['CMO', 220000]], { education: 'bachelor', majors: ['marketing', 'business', 'communications', 'graphic_design', 'journalism', 'psychology'] }, { stress: 40 }),
  j('management_consultant', 'office', '💼', [['Analyst', 70000], ['Consultant', 105000], ['Senior Consultant', 150000], ['Partner', 320000]], { education: 'bachelor', minSmarts: 70 }, { stress: 60 }),
  j('executive', 'office', '🏢', [['Management Trainee', 55000], ['Department Manager', 85000], ['Director', 140000], ['Vice President', 220000], ['CEO', 450000]], { education: 'bachelor', majors: ['business', 'economics', 'finance', 'marketing', 'accounting'], minSmarts: 60, experience: 4 }, { stress: 60 }),
  // Finance
  j('bank_teller', 'finance', '🏦', [['Bank Teller', 32000], ['Senior Teller', 40000], ['Branch Manager', 72000]], { education: 'high_school', noRecord: true }, { stress: 25 }),
  j('accountant', 'finance', '🧾', [['Junior Accountant', 48000], ['Accountant', 68000], ['Senior Accountant', 92000], ['Finance Director', 150000], ['CFO', 260000]], { education: 'bachelor', majors: ['accounting', 'finance', 'economics', 'business', 'mathematics'], minSmarts: 50, noRecord: true }, { stress: 40 }),
  j('financial_analyst', 'finance', '📊', [['Financial Analyst', 62000], ['Senior Analyst', 90000], ['Portfolio Manager', 160000], ['Managing Director', 350000]], { education: 'bachelor', majors: ['finance', 'economics', 'mathematics', 'business', 'accounting'], minSmarts: 65 }, { stress: 55 }),
  j('insurance_agent', 'finance', '📋', [['Insurance Agent', 40000], ['Senior Agent', 58000], ['Agency Manager', 88000]], { education: 'high_school', minLooks: 30 }, { stress: 35 }),
  // Tech
  j('it_support', 'tech', '🖥️', [['Help Desk Technician', 38000], ['IT Specialist', 55000], ['Systems Administrator', 78000], ['IT Director', 130000]], { education: 'high_school', minSmarts: 45 }, { stress: 30 }),
  j('software_dev', 'tech', '💻', [['Junior Developer', 68000], ['Software Developer', 98000], ['Senior Developer', 140000], ['Staff Engineer', 190000], ['CTO', 300000]], { education: 'bachelor', majors: ['computer_science', 'engineering', 'mathematics', 'physics'], minSmarts: 60 }, { stress: 40 }),
  j('data_scientist', 'tech', '🧮', [['Data Analyst', 65000], ['Data Scientist', 110000], ['Lead Data Scientist', 160000], ['Head of Data', 230000]], { education: 'bachelor', majors: ['computer_science', 'mathematics', 'physics', 'economics', 'engineering'], minSmarts: 70 }, { stress: 40 }),
  j('web_designer', 'tech', '🎨', [['Junior Web Designer', 42000], ['Web Designer', 60000], ['UX Lead', 95000], ['Design Director', 140000]], { education: 'high_school', majors: [], minSmarts: 40, minLooks: 0 }, { stress: 30 }),
  // Health
  j('caregiver', 'health', '🩺', [['Caregiver', 27000], ['Senior Caregiver', 34000], ['Nursing Home Manager', 55000]], { education: 'high_school' }, { stress: 40 }),
  j('paramedic', 'health', '🚑', [['EMT', 36000], ['Paramedic', 52000], ['Senior Paramedic', 66000], ['EMS Supervisor', 85000]], { education: 'high_school', minHealth: 55, minSmarts: 45 }, { stress: 55, danger: 15 }),
  j('nurse', 'health', '💉', [['Registered Nurse', 62000], ['Charge Nurse', 78000], ['Nurse Practitioner', 110000], ['Director of Nursing', 145000]], { education: 'bachelor', majors: ['nursing', 'biology'], minSmarts: 50 }, { stress: 50 }),
  j('pharmacist', 'health', '💊', [['Pharmacy Intern', 50000], ['Pharmacist', 115000], ['Senior Pharmacist', 135000], ['Pharmacy Owner', 180000]], { education: 'bachelor', majors: ['chemistry', 'biology'], minSmarts: 65 }, { stress: 35 }),
  j('doctor', 'health', '🩻', [['Medical Resident', 62000], ['Physician', 180000], ['Attending Physician', 240000], ['Chief of Medicine', 350000]], { education: 'doctor:medicine', minSmarts: 70 }, { stress: 60, fame: 1 }),
  j('surgeon', 'health', '🔪', [['Surgical Resident', 65000], ['Surgeon', 280000], ['Senior Surgeon', 380000], ['Chief Surgeon', 520000]], { education: 'doctor:medicine', minSmarts: 80, minHealth: 50 }, { stress: 70, fame: 2 }),
  j('dentist', 'health', '🦷', [['Associate Dentist', 110000], ['Dentist', 160000], ['Practice Owner', 240000]], { education: 'doctor:dentistry', minSmarts: 65 }, { stress: 40 }),
  j('therapist', 'health', '🛋️', [['Counselor', 42000], ['Therapist', 65000], ['Clinical Psychologist', 98000], ['Practice Director', 140000]], { education: 'bachelor', majors: ['psychology'], minSmarts: 55 }, { stress: 35 }),
  j('vet', 'health', '🐾', [['Vet Assistant', 30000], ['Veterinarian', 95000], ['Senior Veterinarian', 125000], ['Clinic Owner', 170000]], { education: 'bachelor', majors: ['biology', 'chemistry'], minSmarts: 65 }, { stress: 40 }),
  // Law
  j('paralegal', 'law', '📑', [['Legal Assistant', 38000], ['Paralegal', 52000], ['Senior Paralegal', 68000]], { education: 'bachelor', noRecord: true }, { stress: 35 }),
  j('lawyer', 'law', '⚖️', [['Junior Associate', 85000], ['Associate', 130000], ['Senior Associate', 180000], ['Partner', 320000], ['Managing Partner', 500000]], { education: 'doctor:law', noRecord: true, minSmarts: 65 }, { stress: 65 }),
  j('judge', 'law', '👩‍⚖️', [['Magistrate', 120000], ['District Judge', 170000], ['Appeals Judge', 220000], ['Supreme Court Justice', 290000]], { education: 'doctor:law', noRecord: true, minSmarts: 75, experience: 10, minAge: 40 }, { stress: 50, fame: 2 }),
  // Education
  j('teacher', 'education', '🍎', [['Teaching Assistant', 30000], ['Teacher', 48000], ['Senior Teacher', 60000], ['Department Head', 75000], ['Principal', 105000]], { education: 'bachelor', noRecord: true }, { stress: 40 }),
  j('professor', 'education', '🎓', [['Lecturer', 58000], ['Assistant Professor', 80000], ['Associate Professor', 105000], ['Professor', 145000], ['Dean', 200000]], { education: 'doctor', minSmarts: 75 }, { stress: 35, fame: 1 }),
  j('librarian', 'education', '📚', [['Library Assistant', 30000], ['Librarian', 48000], ['Head Librarian', 65000]], { education: 'bachelor', minSmarts: 50 }, { stress: 15 }),
  // Science
  j('lab_tech', 'science', '🔬', [['Lab Technician', 40000], ['Senior Technician', 55000], ['Lab Manager', 78000]], { education: 'bachelor', majors: ['biology', 'chemistry', 'physics', 'engineering'] }, { stress: 25 }),
  j('scientist', 'science', '🧪', [['Research Assistant', 48000], ['Research Scientist', 85000], ['Senior Scientist', 120000], ['Principal Investigator', 165000]], { education: 'master', minSmarts: 70 }, { stress: 35, fame: 1 }),
  j('engineer', 'science', '⚙️', [['Junior Engineer', 62000], ['Engineer', 88000], ['Senior Engineer', 125000], ['Chief Engineer', 180000]], { education: 'bachelor', majors: ['engineering', 'physics', 'mathematics', 'computer_science'], minSmarts: 60 }, { stress: 40, danger: 5 }),
  j('pilot', 'science', '✈️', [['First Officer', 70000], ['Captain', 150000], ['Senior Captain', 220000], ['Chief Pilot', 280000]], { education: 'bachelor', minSmarts: 60, minHealth: 70, noRecord: true }, { stress: 45, danger: 8, fame: 1 }),
  // Creative
  j('graphic_designer', 'creative', '🖌️', [['Junior Designer', 38000], ['Graphic Designer', 55000], ['Art Director', 90000], ['Creative Director', 140000]], { education: 'high_school', minSmarts: 30 }, { stress: 30 }),
  j('journalist', 'creative', '📰', [['Junior Reporter', 36000], ['Reporter', 52000], ['Senior Correspondent', 78000], ['Editor-in-Chief', 130000]], { education: 'bachelor', majors: ['journalism', 'english', 'communications', 'political_science', 'history'] }, { stress: 45, fame: 3 }),
  j('photographer', 'creative', '📷', [['Photo Assistant', 26000], ['Photographer', 42000], ['Senior Photographer', 65000], ['Studio Owner', 95000]], { education: 'none', minLooks: 0, minSmarts: 25 }, { stress: 25, fame: 1 }),
  j('writer', 'creative', '✍️', [['Copywriter', 38000], ['Staff Writer', 52000], ['Senior Writer', 72000], ['Published Author', 110000]], { education: 'high_school', minSmarts: 55 }, { stress: 30, fame: 2 }),
  j('actor', 'creative', '🎭', [['Extra', 18000], ['Supporting Actor', 45000], ['Lead Actor', 150000], ['Movie Star', 1200000]], { education: 'none', minLooks: 60, trait: undefined }, { stress: 45, fame: 8 }),
  j('musician', 'creative', '🎸', [['Session Musician', 22000], ['Touring Musician', 48000], ['Recording Artist', 160000], ['Headliner', 900000]], { education: 'none', minSmarts: 25 }, { stress: 40, fame: 8 }),
  j('chef_tv', 'creative', '📺', [['Food Blogger', 24000], ['TV Cook', 70000], ['Celebrity Chef', 300000]], { education: 'none', experience: 3, minLooks: 40 }, { stress: 45, fame: 6 }),
  // Sports
  j('athlete', 'sports', '🏅', [['Semi-pro Athlete', 28000], ['Professional Athlete', 120000], ['Star Athlete', 800000], ['Hall of Famer', 3000000]], { education: 'none', minHealth: 85, minAge: 18 }, { stress: 50, danger: 30, fame: 10 }),
  j('coach', 'sports', '📣', [['Assistant Coach', 34000], ['Coach', 55000], ['Head Coach', 110000], ['Director of Athletics', 180000]], { education: 'high_school', minHealth: 50, experience: 2 }, { stress: 40, fame: 2 }),
];

export const JOB_BY_ID: Record<string, JobDef> = Object.fromEntries(JOBS.map((x) => [x.id, x]));
