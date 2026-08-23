import { useCallback, useState } from "react";
import { Alert, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { TeamUser } from "../types";
import { Button, Card, Field, Loading, Screen, colors } from "../ui";

export function TeamScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await api<{ users: TeamUser[] }>("/api/users");
    setUsers(res.users);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load]),
  );

  async function add() {
    try {
      setBusy(true);
      await api("/api/users", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setName("");
      setEmail("");
      setPassword("");
      await load();
    } catch (err) {
      Alert.alert("Could not add", err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>Team</Text>
      {user?.role === "owner" ? (
        <Card>
          <Field label="Name" value={name} onChangeText={setName} />
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button title={busy ? "Adding…" : "Add team user"} onPress={add} disabled={busy} />
        </Card>
      ) : (
        <Text style={{ color: colors.muted, marginBottom: 12 }}>
          Only the owner can add team users.
        </Text>
      )}
      {users.map((u) => (
        <Card key={u.id}>
          <Text style={{ fontWeight: "700" }}>{u.name}</Text>
          <Text style={{ color: colors.muted }}>
            {u.email} · {u.role}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
