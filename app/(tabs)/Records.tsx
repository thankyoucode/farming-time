import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery, useRealm } from "@realm/react";
import React, { useCallback, useMemo } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Session } from "../../models/Session";

// 🕒 Format milliseconds to hh:mm:ss
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours > 0 ? hours + "h " : ""}${minutes}m ${seconds}s`;
};

// 🕰 Format time only
const formatTimeOnly = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

type LogType = "start" | "pause" | "resume" | "finish";

const logColorMap: Record<LogType, string> = {
  start: "#A5D6A7",
  pause: "#FFF59D",
  resume: "#CE93D8",
  finish: "#EF9A9A",
};

// 🗓 Group sessions by Today / Yesterday / Older
const groupSessionsByDate = (sessions: Realm.Results<Session>) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  const groups: Record<string, Session[]> = {};

  sessions.forEach((s) => {
    const sessionDate = new Date(s.startTime);
    let groupKey = sessionDate.toDateString();

    if (isSameDay(sessionDate, today)) groupKey = "Today";
    else if (isSameDay(sessionDate, yesterday)) groupKey = "Yesterday";

    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(s);
  });

  return groups;
};

export default function Records() {
  const realm = useRealm();
  const sessions = useQuery(Session).sorted("startTime", true);

  const grouped = useMemo(() => groupSessionsByDate(sessions), [sessions]);

  useFocusEffect(
    useCallback(() => {
      // Realm auto-updates queries, so nothing manual needed
    }, [])
  );

  const deleteAll = () => {
    Alert.alert("Confirm", "Delete all session records?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete All",
        style: "destructive",
        onPress: () => {
          realm.write(() => {
            realm.delete(sessions);
          });
        },
      },
    ]);
  };

  const deleteSession = (id: Realm.BSON.ObjectId) => {
    Alert.alert("Confirm", "Delete this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          realm.write(() => {
            const s = realm.objectForPrimaryKey(Session, id);
            if (s) realm.delete(s);
          });
        },
      },
    ]);
  };

  const editSession = (session: Session) => {
    // Placeholder for future editing feature
    Alert.alert(
      "Edit Feature Coming",
      `This will open an edit modal for ${session.farmerName}`
    );
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
    >
      {sessions.length === 0 ? (
        <Text style={styles.noRecord}>No records found.</Text>
      ) : (
        <>
          {Object.entries(grouped).map(([label, list]) => (
            <View key={label} style={styles.dateGroup}>
              <Text style={styles.dateTitle}>{label}</Text>

              {list.map((s) => (
                <View key={s._id.toHexString()} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <Text style={styles.farmerName}>{s.farmerName}</Text>
                    <Text style={styles.timeRange}>
                      {formatTimeOnly(s.startTime)} -{" "}
                      {formatTimeOnly(s.endTime)}
                    </Text>
                  </View>

                  <View style={styles.sessionDetails}>
                    <Text>Total Time: {formatTime(s.totalTime)}</Text>
                    <Text>Price/hr: ₹ {s.pricePerHour}</Text>
                    <Text>Total Cost: ₹ {s.totalCost.toFixed(2)}</Text>
                  </View>

                  <View style={styles.logsContainer}>
                    {s.logs
                      ?.slice()
                      .sort((a, b) => a.time - b.time)
                      .map((l, i) => (
                        <View
                          key={i}
                          style={[
                            styles.logItem,
                            { backgroundColor: logColorMap[l.type as LogType] },
                          ]}
                        >
                          <Text>
                            [{formatTimeOnly(l.time)}] {l.type.toUpperCase()}
                          </Text>
                        </View>
                      ))}
                  </View>

                  <View style={styles.actionRow}>
                    {/* <TouchableOpacity
                      onPress={() => editSession(s)}
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#43A047" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="pencil"
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.actionLabel}>Edit</Text>
                    </TouchableOpacity> */}

                    <TouchableOpacity
                      onPress={() => deleteSession(s._id)}
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#E53935" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="delete"
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.actionLabel}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))}

          <TouchableOpacity onPress={deleteAll} style={styles.deleteAllButton}>
            <MaterialCommunityIcons name="delete" size={28} color="#fff" />
            <Text style={styles.deleteAllText}>Delete All</Text>
          </TouchableOpacity>
        </>
      )}
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
  noRecord: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 40,
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
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  farmerName: { fontSize: 16, fontWeight: "700", color: THEME.textDark },
  timeRange: { fontSize: 13, color: "#33691E" },
  sessionDetails: { marginBottom: 8 },
  logsContainer: { marginTop: 8 },
  logItem: {
    padding: 6,
    borderRadius: 6,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionLabel: { color: "#fff", marginLeft: 4, fontSize: 13 },
  deleteAllButton: {
    alignSelf: "center",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "#C62828",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  deleteAllText: { color: "#fff", fontSize: 14, marginLeft: 8 },
});
