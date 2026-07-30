export type Category = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type CategoryInput = {
  name: string;
  description?: string | null;
};
