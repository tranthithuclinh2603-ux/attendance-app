import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB5gn744U_dPWVsXfDrICDG6fjP0A1B_jo",
  authDomain: "diemdanh-41ddb.firebaseapp.com",
  databaseURL: "https://diemdanh-41ddb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "diemdanh-41ddb",
  storageBucket: "diemdanh-41ddb.firebasestorage.app",
  messagingSenderId: "130886362301",
  appId: "1:130886362301:web:cefb3c001fd863de0643d4",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export default app;