import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCBc2s0PxOH7hu8k6Hq1xo-fWlfYk8H1Hc",
  authDomain: "annotation-plugin.firebaseapp.com",
  projectId: "annotation-plugin",
  storageBucket: "annotation-plugin.appspot.com",
  messagingSenderId: "721714725521",
  appId: "1:721714725521:web:2d388eb3ea6d334b047530",
  measurementId: "G-EEFZYGD1TX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
