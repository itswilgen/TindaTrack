export type RegisterBusinessInput = {
  firebase_uid?: string | null;
  owner_name: string;
  email: string;
  phone: string;
  password?: string | null;
  business_name: string;
  business_type?: string | null;
  address?: string | null;
  logo_url?: string | null;
  selected_plan?: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type RegisteredBusinessResult = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
  business: {
    id: number;
    business_name: string;
    status: string;
    logo_url: string | null;
    selected_plan: string;
    trial_ends_at: Date | string | null;
  };
};

export type AuthResult = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
  business: {
    id: number;
    business_name: string;
    status: string;
    logo_url: string | null;
    selected_plan: string;
    trial_ends_at: Date | string | null;
  } | null;
};
