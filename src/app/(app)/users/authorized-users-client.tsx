'use client';

import { withAuthorization } from '@/components/with-authorization';
import { PERMISSIONS } from '@/lib/roles';
import { UsersClient } from './users-client';

const AuthorizedUsersClient = withAuthorization(UsersClient, PERMISSIONS.USER_VIEW);

export default AuthorizedUsersClient;
