import {
  type AppOptions,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId =
  process.env.FIREBASE_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const appOptions = (): AppOptions | null => {
  if (!projectId) {
    return null;
  }

  if (clientEmail && privateKey) {
    return {
      credential: cert({
        clientEmail,
        privateKey,
        projectId,
      }),
      projectId,
    };
  }

  return { projectId };
};

const options = appOptions();

const app = options ? (getApps()[0] ?? initializeApp(options)) : null;

export const hasRequiredServerFirebaseConfig = Boolean(app);

export const getAdminDb = () => {
  if (!app) {
    throw new Error("Firebase server configuration is missing.");
  }

  return getFirestore(app);
};
