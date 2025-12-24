  import { initializeApp } from 'firebase/app';
  import { getAuth, connectAuthEmulator } from 'firebase/auth';
  import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
  import { getStorage, connectStorageEmulator } from 'firebase/storage';
  import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  // Initialize services
  export const auth = getAuth(app);
  export const db = getFirestore(app);
  export const storage = getStorage(app);
  export const functions = getFunctions(app, 'us-central1');

  // Use emulators in development (optional)
  // if (window.location.hostname === 'localhost') {
  //   connectAuthEmulator(auth, 'http://localhost:9099');
  //   connectFirestoreEmulator(db, 'localhost', 8080);
  //   connectStorageEmulator(storage, 'localhost', 9199);
  //   connectFunctionsEmulator(functions, 'localhost', 5001);
  // }

  export default app;