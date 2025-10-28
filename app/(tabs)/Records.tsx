import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Log {
  label: string;
  time: number;
  type: "start" | "pause" | "resume" | "finish";
}

interface Session {
  farmerName: string;
  startTime: number;
  endTime: number;
  pauseTimes: { start: number; end?: number }[];
  totalTime: number;
  pricePerHour: string;
  totalCost: number;
  logs: Log[];
}

// 🕒 Format milliseconds to hh:mm:ss
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours > 0 ? hours + "h " : ""}${minutes}m ${seconds}s`;
};

// 🗓 Format timestamp to readable date
const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

// 🕰 Format time only
const formatTimeOnly = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Colors for log types (same as index.tsx)
const logColorMap: Record<Log["type"], string> = {
  start: "#A5D6A7",
  pause: "#FFF59D",
  resume: "#CE93D8",
  finish: "#EF9A9A",
};

export default function Records() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groupedSessions, setGroupedSessions] = useState<
    Record<string, Session[]>
  >({});

  // Fetch sessions from AsyncStorage
  const fetchSessions = async () => {
    try {
      const stored = await AsyncStorage.getItem("sessions");
      const parsed: Session[] = stored ? JSON.parse(stored) : [];

      // Sort sessions newest first
      parsed.sort((a, b) => b.startTime - a.startTime);

      // Group by date
      const grouped: Record<string, Session[]> = {};
      parsed.forEach((s) => {
        const date = formatDate(s.startTime);
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(s);
      });

      // Sort dates newest first and sessions inside each date newest first
      const sortedGrouped: Record<string, Session[]> = {};
      Object.keys(grouped)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .forEach((k) => {
          grouped[k].sort((a, b) => b.startTime - a.startTime);
          sortedGrouped[k] = grouped[k];
        });

      setGroupedSessions(sortedGrouped);
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    }
  };

  const clearRecords = async () => {
    await AsyncStorage.removeItem("sessions");
    fetchSessions();
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <TouchableOpacity
        onPress={fetchSessions}
        style={{
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#02ac81ff",
          borderRadius: 10,
          padding: 10,
          flex: 1,
          marginHorizontal: 4,
          marginVertical: 8,
        }}
      >
        <MaterialCommunityIcons name="update" size={32} color="#fff" />
        <Text style={{ color: "#fff", fontSize: 12, marginTop: 4 }}>
          Update
        </Text>
      </TouchableOpacity>

      {Object.keys(groupedSessions).length === 0 && (
        <Text style={styles.noRecord}>No records found.</Text>
      )}

      {Object.entries(groupedSessions).map(([date, sessions]) => (
        <View key={date} style={styles.dateGroup}>
          <Text style={styles.dateTitle}>{date}</Text>

          {sessions.map((s, idx) => (
            <View key={idx} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Text style={styles.farmerName}>{s.farmerName}</Text>
                <Text style={styles.timeRange}>
                  {formatTimeOnly(s.startTime)} - {formatTimeOnly(s.endTime)}
                </Text>
              </View>

              <View style={styles.sessionDetails}>
                <Text>Total Time: {formatTime(s.totalTime)}</Text>
                <Text>Price/hr: ₹ {s.pricePerHour}</Text>
                <Text>Total Cost: ₹ {s.totalCost.toFixed(2)}</Text>
              </View>

              <View style={styles.logsContainer}>
                {[
                  ...s.logs,
                  ...(s.endTime
                    ? [{ type: "finish" as const, time: s.endTime }]
                    : []),
                ]
                  .slice()
                  .sort((a, b) => a.time - b.time)
                  .map((l, i) => (
                    <View
                      key={i}
                      style={[
                        styles.logItem,
                        { backgroundColor: logColorMap[l.type] },
                      ]}
                    >
                      <Text>
                        [{formatTimeOnly(l.time)}] {l.type.toUpperCase()}
                      </Text>
                    </View>
                  ))}
              </View>
            </View>
          ))}

          <TouchableOpacity
            onPress={clearRecords}
            style={{
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#E53935",
              borderRadius: 10,
              padding: 10,
              flex: 1,
              marginHorizontal: 4,
              marginVertical: 8,
            }}
          >
            <MaterialCommunityIcons name="delete" size={32} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 12, marginTop: 4 }}>
              Delete All
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const THEME = {
  primary: "#2E7D32",
  secondary: "#81C784",
  background: "#F5FFF5",
  textDark: "#1B5E20",
  border: "#C8E6C9",
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: THEME.background },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: THEME.primary,
    textAlign: "center",
    marginBottom: 16,
  },
  noRecord: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 20,
  },
  dateGroup: { marginBottom: 24 },
  dateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.textDark,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 4,
  },
  sessionCard: {
    backgroundColor: THEME.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: THEME.border,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  farmerName: { fontSize: 16, fontWeight: "700", color: THEME.textDark },
  timeRange: { fontSize: 14, color: "#33691E" },
  sessionDetails: { marginBottom: 8 },
  logsContainer: { marginTop: 8 },
  logItem: {
    padding: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
});
