
import * as admin from 'firebase-admin';
import {credential as AppHostingCredential} from 'firebase-admin/app';

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: AppHostingCredential.applicationDefault(),
    });
}

export { admin };
