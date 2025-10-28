import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function RootIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect root "/" to your tabs folder index
    router.replace("/(tabs)");
  }, []);

  return null; // or a splash/loading view
}
