import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRealm } from "@realm/react";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Realm from "realm";

const THEME = {
  primary: "#2E7D32",
  secondary: "#81C784",
  background: "#F5FFF5",
  textDark: "#1B5E20",
  border: "#C8E6C9",
};

const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours > 0 ? hours + "h " : ""}${minutes}m ${seconds}s`;
};

export default function App() {
  const [farmerName, setFarmerName] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pauseTimes, setPauseTimes] = useState<
    { start: number; end?: number }[]
  >([]);
  const [isPaused, setIsPaused] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState<
    { type: "start" | "pause" | "resume" | "finish"; time: number }[]
  >([]);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const realm = useRealm();
  const calculateActiveTime = () => {
    if (!startTime) return 0;
    let active = (endTime ?? Date.now()) - startTime;
    pauseTimes.forEach(({ start, end }) => {
      //   active -= end ?? Date.now() - start;
      active -= end != null ? end - start : Date.now() - start;
    });

    return Math.max(active, 0);
  };

  useEffect(() => {
    if (startTime && !isPaused && !endTime) {
      timer.current = setInterval(() => {
        setElapsed(calculateActiveTime());
      }, 1000);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [startTime, isPaused, pauseTimes, endTime]);

  const addLog = (type: "start" | "pause" | "resume" | "finish") => {
    setLogs((prev) => [...prev, { type, time: Date.now() }]);
    console.log(type);
  };

  const handleStart = () => {
    if (!farmerName.trim() || !pricePerHour.trim()) {
      Alert.alert("Required", "Please enter farmer name and price per hour");
      return;
    }
    setStartTime(Date.now());
    setPauseTimes([]);
    setEndTime(null);
    setIsPaused(false);
    setElapsed(0);
    setLogs([{ type: "start", time: Date.now() }]);
  };

  const handlePause = () => {
    if (startTime && !isPaused && !endTime) {
      setPauseTimes((prev) => [...prev, { start: Date.now() }]);
      setIsPaused(true);
      addLog("pause");
    }
  };

  const handleResume = () => {
    if (isPaused && pauseTimes.length > 0 && !endTime) {
      setPauseTimes((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].end = Date.now();
        return updated;
      });
      setIsPaused(false);
      addLog("resume");
    }
  };

  const calculateCost = (time = elapsed) => {
    const rate = parseFloat(pricePerHour);
    if (isNaN(rate) || rate <= 0) return 0;
    return (time / 3600000) * rate;
  };

  const handleFinish = () => {
    if (!startTime || endTime) return;

    const now = Date.now();
    const newLogs: {
      type: "start" | "pause" | "resume" | "finish";
      time: number;
    }[] = [...logs, { type: "finish", time: now }];

    setEndTime(now);
    setIsPaused(false);
    setElapsed(calculateActiveTime());
    setLogs(newLogs);

    realm.write(() => {
      realm.create("Session", {
        _id: new Realm.BSON.ObjectId(),
        farmerName,
        startTime,
        pauseTimes,
        endTime: now,
        totalTime: calculateActiveTime(),
        pricePerHour,
        totalCost: calculateCost(),
        logs: newLogs,
      });
    });

    console.log(logs);
    console.log(newLogs);
  };

  const ControlButton = ({
    icon,
    label,
    onPress,
    disabled,
    bgColor = "#2E7D32",
  }: {
    icon: string;
    label: string;
    onPress: () => void;
    disabled?: boolean;
    bgColor?: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: disabled ? "#BDBDBD" : bgColor,
        borderRadius: 10,
        padding: 10,
        flex: 1,
        marginHorizontal: 4,
      }}
    >
      <MaterialCommunityIcons name={icon as any} size={32} color="#fff" />
      <Text style={{ color: "#fff", fontSize: 12, marginTop: 4 }}>{label}</Text>
    </TouchableOpacity>
  );

  const logColorMap = {
    start: "#A5D6A7",
    pause: "#FFF59D",
    resume: "#CE93D8",
    finish: "#EF9A9A",
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Farmer Name Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            <MaterialCommunityIcons name="account" size={16} /> Farmer Name
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter farmer name"
            value={farmerName}
            onChangeText={setFarmerName}
          />
        </View>

        {/* Price per Hour Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            <MaterialCommunityIcons name="currency-inr" size={16} /> Price per
            Hour
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Enter price per hour"
            value={pricePerHour}
            onChangeText={setPricePerHour}
          />
        </View>

        {/* Controls */}
        <View
          style={{
            flexDirection: "row",
            marginVertical: 12,
            justifyContent: "space-around",
          }}
        >
          {/* Start / Finish */}
          <ControlButton
            icon={startTime && !endTime ? "stop" : "play"}
            label={startTime && !endTime ? "Finish" : "Start"}
            onPress={startTime && !endTime ? handleFinish : handleStart}
            bgColor={startTime && !endTime ? "#E53935" : "#2E7D32"}
          />

          {/* Pause / Resume */}
          {startTime && !endTime && (
            <ControlButton
              icon={isPaused ? "play-circle" : "pause"}
              label={isPaused ? "Resume" : "Pause"}
              onPress={isPaused ? handleResume : handlePause}
              bgColor={isPaused ? "#7B1FA2" : "#FBC02D"}
            />
          )}
        </View>

        {/* Session Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Time</Text>
            <Text style={styles.summaryValue}>{formatTime(elapsed)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Cost</Text>
            <Text style={styles.summaryValue}>
              ₹ {calculateCost().toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Logs */}
        <View style={styles.logContainer}>
          {logs.map((l, i) => (
            <View
              key={i}
              style={[styles.logItem, { backgroundColor: logColorMap[l.type] }]}
            >
              <Text>{l.type.toUpperCase()}</Text>
              <Text>{new Date(l.time).toLocaleTimeString()}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: THEME.background },
  container: { padding: 16 },
  inputContainer: { marginBottom: 16 },
  label: { marginBottom: 4, color: THEME.textDark, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  summaryLabel: { fontSize: 14, color: THEME.textDark },
  summaryValue: { fontSize: 24, fontWeight: "bold", marginTop: 4 },
  logContainer: {
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 10,
  },
  logItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
});
