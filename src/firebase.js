// Firebase 初期化
//
// 使い方:
// 1. https://console.firebase.google.com/ で新規プロジェクトを作成
// 2. 「プロジェクトの設定」→「全般」→「マイアプリ」で ウェブアプリ を追加（アイコンは </> ）
// 3. 表示された firebaseConfig の値を下の firebaseConfig にコピーする
// 4. Authentication → Sign-in method で「メール/パスワード」を有効化
// 5. Firestore Database を作成（本番環境モードでOK。ルールは firestore.rules を参照）

import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyBu2mpmAiCDrHepXLLz901vopxnf4NrE3A",
  authDomain: "shift-cal-app.firebaseapp.com",
  projectId: "shift-cal-app",
  storageBucket: "shift-cal-app.firebasestorage.app",
  messagingSenderId: "620232872999",
  appId: "1:620232872999:web:d4c9f34d9daf527e526a02",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    // Fast refresh 等で initializeAuth が2回呼ばれた場合はここに来る
    auth = getAuth(app);
  }
}

const db = getFirestore(app);
const functions = getFunctions(app, "asia-northeast1");

export { app, auth, db, functions };
