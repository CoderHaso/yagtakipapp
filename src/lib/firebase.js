import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCN38_0X9F1Qbv8_0RFQXytc67teA5L290",
  authDomain: "yagtakip.firebaseapp.com",
  projectId: "yagtakip",
  storageBucket: "yagtakip.firebasestorage.app",
  messagingSenderId: "460027756275",
  appId: "1:460027756275:web:d0f1177e3b84f17da34186",
  measurementId: "G-L6G35FJY74"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export default app
