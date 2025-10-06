// src/hooks/use-permission.ts
import { useAuth } from '@/contexts/auth-context';
import { ROLES, ROLE_PERMISSIONS } from '@/lib/roles';

export function usePermission() {
  const { user } = useAuth();

  const hasPermission = (permission: string) => {
    if (!user) return false;

    // Admin bypass
    if (user.role === ROLES.ADMIN) return true;

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
  };

  return { hasPermission };
}
