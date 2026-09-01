export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'operator';
  allocated_places?: string[];
}

export interface Tournament {
  id: string;
  name: string;
  sport: string;
  status: string;
  primary_place: string;
  tournament_date: string;
  registration_open: string;
  registration_close: string;
  capacity: number;
  min_members: number;
  max_members: number;
  min_age: number;
  max_age: number;
  show_jersey_size?: number | boolean;
  image: string;
  poster: string;
  address: string;
  description: string;
  sport_description: string;
}

export interface Registration {
  id: string;
  tournament_id: string;
  registration_id: string;
  team_name: string;
  city: string;
  state: string;
  captain: string;
  sub_captain: string | null;
  coach: string | null;
  email: string;
  phone: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  payment_status: 'Pending Verification' | 'Verified' | 'Rejected';
  payment_proof: string | null;
  unique_pass: string | null;
  created_by: string;
  created_at: string;
}
