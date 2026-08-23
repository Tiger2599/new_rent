import { useEffect, useState } from "react";
import { Alert, Text } from "react-native";
import { api, defaultApiUrl, getApiUrl, setApiUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Field, Screen, colors } from "../ui";

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const [rate, setRate] = useState("9");
  const [base, setBase] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getApiUrl().then(setBase);
    api<{ settings: { electricityRate: number } }>("/api/settings")
      .then((res) => setRate(String(res.settings.electricityRate)))
      .catch(() => {});
  }, []);

  async function saveRate() {
    try {
      setBusy(true);
      await api("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ electricityRate: Number(rate) }),
      });
      Alert.alert("Saved", "Electricity rate updated.");
    } catch (err) {
      Alert.alert("Could not save", err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function saveUrl() {
    await setApiUrl(base);
    Alert.alert("Saved", "API URL updated. Restart the app if login fails.");
  }

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>Settings</Text>
      <Text style={{ color: colors.muted, marginBottom: 12 }}>
        Signed in as {user?.name} ({user?.role})
      </Text>
      <Card>
        <Field
          label="Electricity unit rate (all tenants)"
          value={rate}
          onChangeText={setRate}
          keyboardType="numeric"
        />
        <Button title={busy ? "Saving…" : "Save rate"} onPress={saveRate} disabled={busy} />
      </Card>
      <Card>
        <Field
          label="API URL (phone: use your PC LAN IP, e.g. http://192.168.1.10:5000)"
          value={base}
          onChangeText={setBase}
        />
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 8 }}>
          Default emulator URL: {defaultApiUrl()}
        </Text>
        <Button title="Save API URL" onPress={saveUrl} />
      </Card>
      <Button title="Log out" color={colors.red} onPress={() => logout()} />
    </Screen>
  );
}
