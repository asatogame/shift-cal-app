import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  OAuthProvider,
  signInWithCredential,
  linkWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let signingIn = false;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u && !signingIn) {
        signingIn = true;
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.warn("Anonymous sign-in failed:", e.message);
          setInitializing(false);
        }
        signingIn = false;
      } else {
        setUser(u);
        setInitializing(false);
      }
    });
    return unsubscribe;
  }, []);

  const isGuest = () => user?.isAnonymous === true;

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const register = async (email, password, displayName) => {
    if (user?.isAnonymous) {
      const credential = EmailAuthProvider.credential(email, password);
      const result = await linkWithCredential(user, credential);
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      await setDoc(doc(db, "users", result.user.uid), {
        email,
        displayName: displayName || "",
        createdAt: serverTimestamp(),
      });
      setUser({ ...result.user });
      return result;
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    await setDoc(doc(db, "users", cred.user.uid), {
      email,
      displayName: displayName || "",
      createdAt: serverTimestamp(),
    });
    return cred;
  };

  const loginWithApple = async () => {
    const nonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce
    );

    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    const provider = new OAuthProvider("apple.com");
    const oauthCredential = provider.credential({
      idToken: appleCredential.identityToken,
      rawNonce: nonce,
    });

    let result;
    if (user?.isAnonymous) {
      result = await linkWithCredential(user, oauthCredential);
    } else {
      result = await signInWithCredential(auth, oauthCredential);
    }

    const displayName =
      appleCredential.fullName?.givenName && appleCredential.fullName?.familyName
        ? `${appleCredential.fullName.familyName} ${appleCredential.fullName.givenName}`
        : result.user.displayName || "";

    if (displayName && !result.user.displayName) {
      await updateProfile(result.user, { displayName });
    }

    const userRef = doc(db, "users", result.user.uid);
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      await setDoc(userRef, {
        email: result.user.email || appleCredential.email || "",
        displayName,
        createdAt: serverTimestamp(),
      });
    }

    setUser({ ...result.user });
    return result;
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, initializing, isGuest, login, register, loginWithApple, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
