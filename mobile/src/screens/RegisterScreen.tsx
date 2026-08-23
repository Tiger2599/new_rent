import { useState } from "react";
import { Alert, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Field, Screen, colors } from "../ui";
import type { AuthStackParamList } from "../navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    try {
      setBusy(true);
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      Alert.alert("Register failed", err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Text style={{ fontSize: 24, fontWeight: "700", marginBottom: 6 }}>
        New owner
      </Text>
      <Text style={{ color: colors.muted, marginBottom: 20 }}>
        Creates your own tenants and payments, separate from others.
      </Text>
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
        <Button title={busy ? "Creating…" : "Register"} onPress={onSubmit} disabled={busy} />
      </Card>
      <Text
        onPress={() => navigation.goBack()}
        style={{ textAlign: "center", color: colors.green, marginTop: 12 }}
      >
        Back to login
      </Text>
    </Screen>
  );
}
