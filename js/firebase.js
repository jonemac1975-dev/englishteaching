// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyAFYzJMv3HYJwo7SbpD_kAQuqx_zMoMBj8",
  authDomain: "english-teaching-e4242.firebaseapp.com",
  databaseURL: "https://english-teaching-e4242-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "english-teaching-e4242",
  storageBucket: "english-teaching-e4242.appspot.com",
  messagingSenderId: "196358725024",
  appId: "1:196358725024:web:c82e9fc5f4e809cccc98c5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export app để các module khác dùng
export { app };
