import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import CalendarListScreen from "./src/screens/CalendarListScreen";
import CalendarScreen from "./src/screens/CalendarScreen";
import EventFormScreen from "./src/screens/EventFormScreen";
import PhotoImportScreen from "./src/screens/PhotoImportScreen";
import ShareScreen from "./src/screens/ShareScreen";
import ShiftQuickAddScreen from "./src/screens/ShiftQuickAddScreen";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing || !user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#3A50E0" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen
        name="CalendarList"
        component={CalendarListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen
        name="EventForm"
        component={EventFormScreen}
        options={{ title: "予定の編集" }}
      />
      <Stack.Screen
        name="PhotoImport"
        component={PhotoImportScreen}
        options={{ title: "写真から予定登録" }}
      />
      <Stack.Screen
        name="Share"
        component={ShareScreen}
        options={{ title: "カレンダーを共有" }}
      />
      <Stack.Screen
        name="ShiftQuickAdd"
        component={ShiftQuickAddScreen}
        options={{ title: "シフト一括登録" }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="dark" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
