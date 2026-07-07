import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Thêm cấu hình Firebase của bạn ở đây
  apiKey: "AIzaSyBl6RYzSjveBZxIAj-pIDudlSlLnlcPmJw",
  authDomain: "hacktiendao.firebaseapp.com",
  projectId: "hacktiendao",
  storageBucket: "hacktiendao.firebasestorage.app",
  messagingSenderId: "59617961205",
  appId: "1:59617961205:web:f0bbf95b1e7ecca83e51bc",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 