export interface Item {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  tags: string[];
  location?: string;
  created_at: string;
  updated_at: string;
  is_claimed?: boolean;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AIAnalysis {
  name: string;
  description: string;
  tags: string[];
}

export interface ClaimFormData {
  firstName: string;
  lastName: string;
  childName: string;
  childGrade: string;
  itemId: string;
  itemName: string;
}

export interface Claim {
  id: string;
  item_id: string;
  first_name: string;
  last_name: string;
  child_name: string;
  child_grade: string;
  created_at: string;
}