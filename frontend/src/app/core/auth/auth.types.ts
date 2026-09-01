export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export type AccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

/**
 * Safe user representation returned by the backend `GET /api/auth/me` and the
 * session-establishing login/register endpoints. It deliberately excludes
 * internal fields such as password, status reason, provenance, and tokens.
 */
export interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  email_verified_at: string | null;
}

export interface AuthUserEnvelope {
  data: {
    user: SafeUser;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface RegisterEnvelope {
  data: {
    user: SafeUser;
  };
}
