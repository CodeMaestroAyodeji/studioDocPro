import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "./firebase";

const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Sync the Firebase Auth user with Firestore
 * - Creates a user doc if not exists
 * - Updates it if it already exists
 */
export const syncUserToFirestore = async (user: any) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);

  await setDoc(
    userRef,
    {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      role: "user", // default role
      updatedAt: new Date(),
    },
    { merge: true } // ensures we don’t overwrite existing data
  );
};
