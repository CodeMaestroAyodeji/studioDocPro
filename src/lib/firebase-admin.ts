
'use server';

import * as admin from 'firebase-admin';
import { GoogleAuth } from 'google-auth-library';

if (admin.apps.length === 0) {
    const auth = new GoogleAuth({
        scopes: [
            'https://www.googleapis.com/auth/cloud-platform',
            'https://www.googleapis.com/auth/datastore',
            'https://www.googleapis.com/auth/devstorage.full_control',
            'https://www.googleapis.com/auth/firebase',
            'https://www.googleapis.com/auth/identitytoolkit',
            'https://www.googleapis.com/auth/userinfo.email',
        ],
    });

    const credential = new admin.credential.GoogleAuth(auth);

    admin.initializeApp({
        credential,
    });
}

export { admin };
