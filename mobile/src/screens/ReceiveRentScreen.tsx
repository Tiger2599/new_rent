import { useEffect, useMemo, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../lib/api";
import { formatCurrency, formatMonth, today } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Field, Loading, Screen, colors } from "../ui";
import type { TenantsStackParamList } from "../navigation";

type Props = NativeStackScreenProps<TenantsStackParamList, "ReceiveRent">;

type RentInfo = {
  pendingMonths: string[];
  pendingRemaining: Record<string, number>;
  advanceMonths: string[];
  pendingDeposit: number;
  lastElectricityUnits: number;
  electricityRate: number;
};

type Tab = "rent" | "advance" | "deposit";

export function ReceiveRentScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { user } = useAuth();
  const [info, setInfo] = useState<RentInfo | null>(null);
  const [tab, setTab] = useState<Tab>("rent");
  const [selected, setSelected] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [receivedDate, setReceivedDate] = useState(today());
  const [note, setNote] = useState("");
  const [electricityUnits, setElectricityUnits] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<RentInfo>(`/api/tenants/${id}/rent`)
      .then((res) => {
        setInfo(res);
        setSelected(res.pendingMonths.slice(0, 1));
        const first = res.pendingMonths[0];
        if (first) setAmount(String(res.pendingRemaining[first] ?? ""));
      })
      .catch((err) => Alert.alert("Error", err instanceof Error ? err.message : "Error"));
  }, [id]);

  const months = tab === "rent" ? info?.pendingMonths ?? [] : info?.advanceMonths ?? [];

  const extraElectricity = useMemo(() => {
    if (tab !== "rent" || !info || !electricityUnits) return 0;
    const next = Number(electricityUnits);
    if (!Number.isFinite(next) || next <= info.lastElectricityUnits) return 0;
    return (next - info.lastElectricityUnits) * info.electricityRate;
  }, [tab, info, electricityUnits]);

  function toggleMonth(month: string) {
    setSelected((cur) =>
      cur.includes(month) ? cur.filter((m) => m !== month) : [...cur, month].sort(),
    );
  }

  async function onSave() {
    try {
      setBusy(true);
      const body: Record<string, unknown> = {
        type: tab,
        amount: Number(amount) + (tab === "rent" ? extraElectricity : 0),
        receivedDate,
        note,
        receivedBy: user?.name ?? "Admin",
      };
      if (tab !== "deposit") body.rentMonths = selected;
      if (tab === "rent" && electricityUnits) body.electricityUnits = Number(electricityUnits);
      await api(`/api/tenants/${id}/rent`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert("Could not receive", err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (!info) return <Loading />;

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Receive</Text>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        {(["rent", "advance", "deposit"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => {
              setTab(t);
              setSelected(t === "rent" ? info.pendingMonths.slice(0, 1) : []);
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: tab === t ? colors.dark : "#e5e7eb",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                color: tab === t ? "#fff" : colors.text,
                fontWeight: "600",
              }}
            >
              {t === "rent" ? "Pending" : t === "advance" ? "Advance" : "Deposit"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "deposit" ? (
        <Card>
          <Text>Pending deposit {formatCurrency(info.pendingDeposit)}</Text>
        </Card>
      ) : (
        <Card>
          {months.length === 0 ? (
            <Text style={{ color: colors.muted }}>No months.</Text>
          ) : (
            months.map((m) => (
              <TouchableOpacity key={m} onPress={() => toggleMonth(m)} style={{ paddingVertical: 8 }}>
                <Text style={{ fontWeight: selected.includes(m) ? "700" : "400" }}>
                  {selected.includes(m) ? "☑ " : "☐ "}
                  {formatMonth(m)}
                  {tab === "rent" ? ` · ${formatCurrency(info.pendingRemaining[m] ?? 0)}` : ""}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </Card>
      )}

      {tab === "rent" ? (
        <Card>
          <Text style={{ marginBottom: 8 }}>
            Last reading {info.lastElectricityUnits} · ₹{info.electricityRate}/unit
          </Text>
          <Field
            label="New electricity units (must be greater than last)"
            value={electricityUnits}
            onChangeText={setElectricityUnits}
            keyboardType="numeric"
          />
          {extraElectricity > 0 ? (
            <Text>Electricity charge {formatCurrency(extraElectricity)}</Text>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <Field label="Date (YYYY-MM-DD)" value={receivedDate} onChangeText={setReceivedDate} />
        <Field label="Note" value={note} onChangeText={setNote} />
        <Button title={busy ? "Saving…" : "Save"} onPress={onSave} disabled={busy} />
      </Card>
    </Screen>
  );
}
