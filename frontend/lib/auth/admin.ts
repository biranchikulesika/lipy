import { getSupabaseAdmin } from '@/lib/supabase/server';

export type AdminRole = 'owner' | 'admin' | 'verifier' | 'viewer';

export interface AdminUser {
  id: string;
  role: AdminRole;
  created_at: string;
}

const ROLE_HIERARCHY: Record<AdminRole, number> = {
  owner: 4,
  admin: 3,
  verifier: 2,
  viewer: 1,
};

/**
 * Fetch the admin record for a user. Returns null if the user is not an admin.
 */
export async function getAdminUser(userId: string): Promise<AdminUser | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('admins')
      .select('id, role, created_at')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as AdminUser;
  } catch {
    return null;
  }
}

/**
 * Get the role of a user. Returns null if not an admin.
 */
export async function getUserRole(userId: string): Promise<AdminRole | null> {
  const admin = await getAdminUser(userId);
  return admin?.role ?? null;
}

/**
 * Check if a user is an admin (owner or admin role).
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  if (!role) return false;
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY['admin'];
}

/**
 * Check if a user is the owner.
 */
export async function isOwner(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'owner';
}

/**
 * Check if a user has the exact specified role.
 */
export async function hasRole(userId: string, role: AdminRole): Promise<boolean> {
  const userRole = await getUserRole(userId);
  return userRole === role;
}

/**
 * Check if a user has at least the specified minimum role (hierarchy check).
 */
export async function hasMinRole(userId: string, minRole: AdminRole): Promise<boolean> {
  const userRole = await getUserRole(userId);
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

/**
 * Permission: can this role verify/unverify dataset samples?
 * viewer cannot. verifier, admin, owner can.
 */
export function canVerifyDataset(role: AdminRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY['verifier'];
}

/**
 * Permission: can this role delete dataset samples?
 * viewer and verifier cannot. admin and owner can.
 */
export function canDeleteDataset(role: AdminRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY['admin'];
}

/**
 * Map Supabase authentication errors to user-friendly messages.
 * Never exposes internal error details to the user.
 */
export function getFriendlyAuthError(errorMessage: string, provider?: string): string {
  const providerLabel = provider
    ? provider.charAt(0).toUpperCase() + provider.slice(1)
    : 'this';

  const lowerMsg = errorMessage.toLowerCase();

  if (
    lowerMsg.includes('signup_disabled') ||
    lowerMsg.includes('access_denied') ||
    lowerMsg.includes('invalid_grant') ||
    lowerMsg.includes('not found') ||
    lowerMsg.includes('no user') ||
    lowerMsg.includes('user not found')
  ) {
    return `No account found associated with this ${providerLabel} account.`;
  }

  return `No account found associated with this ${providerLabel} account.`;
}
