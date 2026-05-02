// src/firebase/config.js
// ⚠️ SUSTITUIR los valores de firebaseConfig con los de tu proyecto Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAlQagBQMV8IMLmEAwr8VH1SvhiLcvctC8",
  authDomain: "app-manager-proyectos.firebaseapp.com",
  projectId: "app-manager-proyectos",
  storageBucket: "app-manager-proyectos.firebasestorage.app",
  messagingSenderId: "173490539244",
  appId: "1:173490539244:web:fff262dfcebf03ca4ef3c9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
