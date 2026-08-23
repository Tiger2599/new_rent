import { useState } from "react";
import { Alert, Text, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Field, Screen, colors } from "../ui";
import type { AuthStackParamList } from "../navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    try {
      setBusy(true);
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert("Login failed", err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 6 }}>
        Rent App
      </Text>
      <Text style={{ color: colors.muted, marginBottom: 20 }}>
        Sign in with the same account as the website.
      </Text>
      <Card>
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
        <Button title={busy ? "Signing in…" : "Sign in"} onPress={onSubmit} disabled={busy} />
      </Card>
      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={{ textAlign: "center", color: colors.green, marginTop: 8 }}>
          Create owner account
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}
