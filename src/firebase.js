// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDMwNsVDVMepF5GAp3_hMVZMWvnO2giA-c",
  authDomain: "keep-notes-management-app.firebaseapp.com",
  projectId: "keep-notes-management-app",
  storageBucket: "keep-notes-management-app.appspot.com",
  messagingSenderId: "1097214941660",
  appId: "1:1097214941660:web:1a878697b2fb9bd4345719",
  measurementId: "G-9TB7NYZ7YJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider, analytics, app };
