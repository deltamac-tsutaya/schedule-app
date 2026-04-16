/**
 * Firebase 設定檔
 *
 * Firestore 安全規則（請在 Firebase Console → Firestore → 規則 貼上並發佈）：
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /schedules/{document=**} {
 *       allow read: if true;
 *       allow write: if request.auth != null;
 *     }
 *     match /employees/{empId} {
 *       allow read: if true;
 *       allow write: if request.auth != null;
 *     }
 *   }
 * }
 */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCFw5VwxRvdDINnOIwIaUxwvyAav447Vwg",
  authDomain: "schedule-app-19839.firebaseapp.com",
  projectId: "schedule-app-19839",
  storageBucket: "schedule-app-19839.firebasestorage.app",
  messagingSenderId: "864199067684",
  appId: "1:864199067684:web:3f1923cc5b418e3e2770b1"
};
