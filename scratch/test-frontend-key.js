import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCfYEUrIjWmjLtVv96yjPHpFU0dPeGKmsU", // Frontend key
  authDomain: "vanij-32b55.firebaseapp.com",
  projectId: "vanij-32b55",
  storageBucket: "vanij-32b55.firebasestorage.app",
  messagingSenderId: "247882474478",
  appId: "1:247882474478:web:052f2035a74e08306c24ff"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

signInWithEmailAndPassword(auth, "nonexistent@example.com", "wrongpassword")
  .then((userCredential) => {
    console.log("Signed in:", userCredential.user.uid);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error.code, error.message);
    process.exit(1);
  });
