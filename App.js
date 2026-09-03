import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import CalendarListScreen from "./src/screens/CalendarListScreen";
import CalendarScreen from "./src/screens/CalendarScreen";
import EventFormScreen from "./src/screens/EventFormScreen";
import PhotoImportScreen from "./src/screens/PhotoImportScreen";
import ShareScreen from "./src/screens/ShareScreen";
import ShiftQuickAddScreen from "./src/screens/ShiftQuickAddScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ShiftTabScreen from "./src/screens/ShiftTabScreen";
import NotificationsScreen from "./src/screens/NotificationsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

function CalendarStack() {
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

function ShiftStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen
        name="ShiftTab"
        component={ShiftTabScreen}
        options={{ title: "シフト" }}
      />
      <Stack.Screen
        name="ShiftQuickAdd"
        component={ShiftQuickAddScreen}
        options={{ title: "シフト一括登録" }}
      />
      <Stack.Screen
        name="PhotoImport"
        component={PhotoImportScreen}
        options={{ title: "写真から予定登録" }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: 4,
          height: 56,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="CalendarTab"
        component={CalendarStack}
        options={{
          tabBarLabel: "カレンダー",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ShiftTabNav"
        component={ShiftStack}
        options={{
          tabBarLabel: "シフト",
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚡" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: "通知",
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          tabBarLabel: "通知",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "設定",
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          tabBarLabel: "設定",
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, initializing } = useAuth();
  const { colors } = useTheme();

  if (initializing || !user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return <MainTabs />;
}

function StatusBarThemed() {
  const { colors } = useTheme();
  return <StatusBar style={colors.statusBar} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <StatusBarThemed />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
