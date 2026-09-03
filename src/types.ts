export type Persona = "student" | "coach" | "moderator";
export type Lang = "pt" | "en";
export type Theme = "dark" | "light";

export interface Anamnesis {
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: float;
  goal: string;
  activity_level: string;
  restrictions: string;
  allergies: string;
  medical_notes?: string;
  photo_front?: string;
  photo_side?: string;
  photo_back?: string;
}

export type float = number;

export interface AssessmentEntry {
  id: string;
  date: string;
  weight_kg: number;
  waist_cm?: number;
  right_arm_cm?: number;
  left_arm_cm?: number;
  right_leg_cm?: number;
  left_leg_cm?: number;
  photo_front?: string;
  photo_side?: string;
  photo_back?: string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  full_name?: string;
  nickname: string;
  email: string;
  avatar_url?: string;
  height_cm?: number;
  weight_kg?: number;
  waist_cm?: number;
  right_arm_cm?: number;
  left_arm_cm?: number;
  right_leg_cm?: number;
  left_leg_cm?: number;
  last_assessment_date?: string;
  assessments?: AssessmentEntry[];
  anamnesis?: Anamnesis | null;
  anamnesis_done: boolean;
  water_ml: number;
  creatine_g: number;
  creatine_dose_g?: number;
  creatine_times: string[];
  creatine_taken_today?: Record<string, boolean>;
  logged_in: boolean;
}

export interface Student {
  id: string;
  name: string;
  nickname: string;
  email: string;
  avatar_url?: string;
  plan: string;
  goal: string;
  weight_kg: number;
  height_cm: number;
  waist_cm?: number;
  last_assessment?: string;
  restrictions?: string;
  adherence_pct?: number;
  diet?: Diet;
  workout?: Workout;
}

export type BillingCycle = "month" | "quarter" | "semester" | "year" | "single";

export interface PlanPrices {
  month: number;
  quarter: number;
  semester?: number;
  year: number;
  single?: number;
}

export interface Plan {
  id: string;
  slug: string;
  name: string;
  tag: string | null;
  description: string;
  accent: string;
  theme_color?: "pink" | "blue" | "gold" | string;
  prices_brl: PlanPrices;
  prices_usd: PlanPrices;
  perks: string[];
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  muscle: string;
  video_url: string;
  coach_tip: string;
  coach_message?: string;
  substitute_exercise?: string;
}

export interface Workout {
  id: string;
  day_label: string;
  title: string;
  focus: string;
  duration_min: number;
  intensity: string;
  coach_note: string;
  hero_image: string;
  exercises: Exercise[];
  assigned_student_ids?: string[];
  is_template?: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  grams: number;
  kcal: number;
  p: number;
  c: number;
  f: number;
  meal: "breakfast" | "lunch" | "snack" | "dinner" | "supper";
  options?: string[];
}

export interface Diet {
  id: string;
  kcal: number;
  protein_pct: number;
  carbs_pct: number;
  fats_pct: number;
  foods: FoodItem[];
}

export interface ProgressEntry {
  id: string;
  date: string;
  weight_kg: number;
  waist_cm?: number;
  arms_cm?: number;
  note?: string;
}

export interface ChallengeEvent {
  id: string;
  title: string;
  subtitle: string;
  rules: string;
  prize: string;
  start_date: string;
  end_date: string;
  status: "active" | "loading" | "closed";
  is_active: boolean;
  champion?: {
    id: string;
    name: string;
    title: string;
    votes: number;
    photo: string;
    date: string;
    weeks?: number;
  } | null;
}

export interface ChallengePhoto {
  id: string;
  user_id?: string;
  participant_name: string;
  caption?: string;
  photo_url: string;
  category: "shape" | "force" | "reset12" | string;
  votes_count: number;
  created_at: string;
  has_voted?: boolean;
}

export interface PhotoVote {
  id: string;
  photo_id: string;
  user_id: string;
  created_at: string;
}

export interface Challenge {
  id: string;
  author: string;
  student_id?: string;
  title: string;
  weeks: number;
  weight_lost_kg?: number;
  waist_reduction_cm?: number;
  story?: string;
  before_image: string;
  after_image: string;
  likes: number;
  votes: number;
  tag: string;
  status: "active" | "closed";
  vote_url?: string;
  has_voted?: boolean;
  created_at?: string;
}

export interface HallEntry {
  id: string;
  champion: string;
  title: string;
  date: string;
  photo: string;
  votes: number;
}

export interface ChatMessage {
  id: string;
  author: string;
  persona: string;
  text: string;
  image?: string | null;
  likes: number;
  timestamp: string;
}

export interface KPI {
  label_pt: string;
  label_en: string;
  value: string;
  delta: string;
}

export interface RadarAlert {
  id: string;
  student: string;
  status: string;
  days: number;
  severity: "warn" | "info" | "crit";
}

export interface Coupon {
  id: string;
  code: string;
  pct: number;
  active: boolean;
}

export interface Partner {
  id: string;
  email: string;
  active: boolean;
}

export interface Coach {
  id: string;
  email: string;
  active: boolean;
}

export interface Broadcast {
  id: string;
  text: string;
  author: string;
  date: string;
}

export interface Subscription {
  active: boolean;
  planId?: string;
  cycle?: BillingCycle;
}
