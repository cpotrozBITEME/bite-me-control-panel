import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA2qbXrzceHrSFbE1T1SeEkunH4SvHMBNU",
  authDomain: "bite-me-menu.firebaseapp.com",
  projectId: "bite-me-menu",
  storageBucket: "bite-me-menu.firebasestorage.app",
  messagingSenderId: "775472252826",
  appId: "1:775472252826:web:acdbf37640b1ff61241c23",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);