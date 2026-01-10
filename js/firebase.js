// firebase.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAFYzJMv3HYJwo7SbpD_kAQuqx_zMoMBj8",
  authDomain: "english-teaching-e4242.firebaseapp.com",
  databaseURL: "https://english-teaching-e4242-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "english-teaching-e4242",
  storageBucket: "english-teaching-e4242.appspot.com",
  messagingSenderId: "196358725024",
  appId: "1:196358725024:web:c82e9fc5f4e809cccc98c5"
};

// Initialize Firebase app (chỉ 1 lần)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Khởi tạo Realtime Database
const db = getDatabase(app);

// Export cả app lẫn db để dùng module khác
export { app, db };
