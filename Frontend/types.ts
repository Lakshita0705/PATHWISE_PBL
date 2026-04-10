
export interface User {
  id: string;
  name: string;
  email: string;
  careerGoal: string;
  experienceLevel: string;
  skills: string[];
  credibilityScore: number;
  progress: number;
  role?: "student" | "mentor";
  company?: string;
  expertise?: string[];
  rating?: number;
  bio?: string;
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

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

export interface Meeting {
  id: string;
  mentorId: string;
  studentId: string;
  studentName: string;
  mentorName: string;
  date: string;
  time: string;
  status: "scheduled" | "completed" | "cancelled";
}
