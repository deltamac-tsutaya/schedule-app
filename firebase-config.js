/**
 * Firebase 設定檔
 *
 * 設定步驟：
 * 1. 前往 https://console.firebase.google.com 建立新專案
 * 2. 專案建立後，點選「新增應用程式」→「Web」
 * 3. 複製 firebaseConfig 物件內容填入下方
 * 4. 在 Firebase Console 啟用：
 *    - Firestore Database（建立資料庫，選 Production 模式）
 *    - Authentication → 登入方法 → 電子郵件/密碼（啟用）
 * 5. 在 Authentication → 使用者，新增管理員帳號（後台登入用）
 * 6. 在 Firestore → 規則，貼上以下安全規則：
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /schedules/{document=**} {
 *       allow read: if true;
 *       allow write: if request.auth != null;
 *     }
 *   }
 * }
 */
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
