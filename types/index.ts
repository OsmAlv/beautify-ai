export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  is_superuser: boolean;
  nippies_balance: number;
  pretty_generations_remaining: number;
  hot_generations_remaining: number;
  total_paid: number;
}

export interface GenerationLog {
  id: string;
  user_id: string;
  mode: "pretty" | "hot" | "salsa";
  environment?: string;
  cost: number;
  created_at: string;
  image_url?: string;
}
