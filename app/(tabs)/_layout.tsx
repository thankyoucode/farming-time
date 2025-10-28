// app/_layout.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ✅ Single light theme only
const THEME = {
  background: "#F7FFF7",
  headerBg: "#FFFFFF",
  headerBorder: "#E0E0E0",
  tabBg: "#FFFFFF",
  tabBorder: "#DDE8DD",
  active: "#2E7D32",
  inactive: "#A0A0A0",
  title: "#2E7D32",
};

export default function TabLayout() {
  const theme = THEME;
  const insets = useSafeAreaInsets();

  return (
    <>
      {/* ✅ Light-only status bar */}
      <StatusBar style="dark" />

      <Tabs
        screenOptions={{
          sceneStyle: {
            paddingBottom: insets.bottom + 70,
            backgroundColor: theme.background,
          },
          // ✅ Tab bar styling
          tabBarActiveTintColor: theme.active,
          tabBarInactiveTintColor: theme.inactive,
          tabBarShowLabel: true,
          headerStyle: {
            backgroundColor: theme.headerBg,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.headerBorder,
          },
          headerTitleAlign: "left",

          // ✅ Custom header
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <View
                style={[styles.headerIconBox, { backgroundColor: "#E8F5E9" }]}
              >
                <MaterialCommunityIcons
                  name="tractor"
                  size={28}
                  color={theme.active}
                />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.title }]}>
                  Farmer Time
                </Text>
                <Text
                  style={[styles.headerSubtitle, { color: theme.inactive }]}
                >
                  Work smart. Track fair.
                </Text>
              </View>
            </View>
          ),

          // ✅ Fixed tab bar with safe bottom padding (no overlap)
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: theme.tabBg,
              borderTopColor: theme.tabBorder,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: -2 },
              elevation: 3,
              paddingBottom: insets.bottom + 6, // keep bar above safe area
            },
          ],

          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: "600",
            letterSpacing: 0.3,
            marginBottom: Platform.OS === "ios" ? 2 : 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Work",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "timer-sand-complete" : "timer-sand"}
                size={25}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Records"
          options={{
            title: "Records",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "clipboard-list" : "clipboard-text"}
                size={25}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  tabBar: {
    height: 70,
    borderTopWidth: 1,
    borderRadius: 20,
    marginHorizontal: 10,
    marginBottom: Platform.OS === "ios" ? 10 : 6,
    position: "absolute",
    left: 0,
    right: 0,
    paddingTop: 6,
  },
});
