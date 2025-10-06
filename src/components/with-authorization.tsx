// src/components/with-authorization.tsx

import { usePermission } from '@/hooks/use-permission';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function withAuthorization<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: string
) {
  const WithAuthorization = (props: P) => {
    const { hasPermission } = usePermission();
    const router = useRouter();

    useEffect(() => {
      if (!hasPermission(requiredPermission)) {
        router.push('/unauthorized'); // Redirect to an unauthorized page
      }
    }, [hasPermission, router]);

    if (!hasPermission(requiredPermission)) {
      return null; // Or a loading spinner
    }

    return <WrappedComponent {...props} />;
  };

  return WithAuthorization;
}
