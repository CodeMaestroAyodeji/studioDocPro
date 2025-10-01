
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
        });
    } else {
        // Fallback for environments where Application Default Credentials are set, like Google Cloud Run
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    }
}

export { admin };
