import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSy-dummy-key-for-build",
  authDomain: "vanij-32b55.firebaseapp.com",
  projectId: "vanij-32b55",
  storageBucket: "vanij-32b55.firebasestorage.app",
  messagingSenderId: "247882474478",
  appId: "1:247882474478:web:052f2035a74e08306c24ff"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

signInWithEmailAndPassword(auth, "test@example.com", "password123")
  .then((userCredential) => {
    console.log("Signed in:", userCredential.user.uid);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error.code, error.message);
    // If it's a network error or JSON error, let's see the full error if possible
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  });
