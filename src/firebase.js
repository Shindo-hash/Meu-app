// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAVaU7n2d_J4uf9eSir1FLxKzqKFaeqRIs",
  authDomain: "meuappfinanceiro-4dd79.firebaseapp.com",
  projectId: "meuappfinanceiro-4dd79",
  storageBucket: "meuappfinanceiro-4dd79.appspot.com",
  messagingSenderId: "60410564288",
  appId: "1:60410564288:web:e38c19124ddce76e042725"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
