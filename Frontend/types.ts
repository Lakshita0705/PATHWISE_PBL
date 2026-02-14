
export interface User {
  id: string;
  name: string;
  email: string;
  careerGoal: string;
  experienceLevel: string;
  skills: string[];
  credibilityScore: number;
  progress: number;
}

export interface RoadmapModule {
  id: string;
  week: number;
  title: string;
  description: string;
  isCompleted: boolean;
  type: 'learning' | 'quiz' | 'project';
}

export interface Mentor {
  id: string;
  name: string;
  role: string;
  company: string;
  rating: number;
  expertise: string[];
  image: string;
  minCredibility: number;
}
