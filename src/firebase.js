// Import des fonctions Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics"; // facultatif

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBC8aoCw3qGtrzZJ27xRojYaRWCKyFDzbw",
  authDomain: "talkzone-97c41.firebaseapp.com",
  databaseURL: "https://talkzone-97c41-default-rtdb.firebaseio.com", // important pour Realtime DB
  projectId: "talkzone-97c41",
  storageBucket: "talkzone-97c41.appspot.com",
  messagingSenderId: "705748309716",
  appId: "1:705748309716:web:19235b7703b0cd85678d41",
  measurementId: "G-68XW7F0514" // facultatif
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Export des services
export const auth = getAuth(app);
export const db = getDatabase(app);
export const analytics = getAnalytics(app); // facultatif
