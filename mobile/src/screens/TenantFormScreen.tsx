import { useState } from "react";
import { Alert, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../lib/api";
import { today } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Field, Screen } from "../ui";
import type { TenantsStackParamList } from "../navigation";

type Props = NativeStackScreenProps<TenantsStackParamList, "TenantAdd">;

export function TenantFormScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [deposit, setDeposit] = useState("0");
  const [advance, setAdvance] = useState("0");
  const [rent, setRent] = useState("");
  const [rentStartFrom, setRentStartFrom] = useState(today().slice(0, 7) + "-01");
  const [electricityUnits, setElectricityUnits] = useState("0");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSave() {
    try {
      setBusy(true);
      await api("/api/tenants", {
        method: "POST",
        body: JSON.stringify({
          name,
          mobile,
          buildingNumber,
          roomNumber,
          deposit: Number(deposit),
          advance: Number(advance),
          rent: Number(rent),
          rentStartFrom,
          electricityUnits: Number(electricityUnits),
          note,
          receivedBy: user?.name ?? "Admin",
        }),
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert("Could not save", err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Add tenant</Text>
      <Card>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
        <Field label="Building" value={buildingNumber} onChangeText={setBuildingNumber} />
        <Field label="Room" value={roomNumber} onChangeText={setRoomNumber} />
        <Field label="Monthly rent" value={rent} onChangeText={setRent} keyboardType="numeric" />
        <Field label="Deposit" value={deposit} onChangeText={setDeposit} keyboardType="numeric" />
        <Field label="Advance" value={advance} onChangeText={setAdvance} keyboardType="numeric" />
        <Field
          label="Rent start (YYYY-MM-DD)"
          value={rentStartFrom}
          onChangeText={setRentStartFrom}
        />
        <Field
          label="Last electricity units"
          value={electricityUnits}
          onChangeText={setElectricityUnits}
          keyboardType="numeric"
        />
        <Field label="Note" value={note} onChangeText={setNote} />
        <Button title={busy ? "Saving…" : "Save"} onPress={onSave} disabled={busy} />
      </Card>
    </Screen>
  );
}
