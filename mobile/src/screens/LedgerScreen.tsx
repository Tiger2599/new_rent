import { useCallback, useState } from "react";
import { Alert, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../lib/api";
import { formatCurrency, formatDate, today } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import type { BalanceSheetItem } from "../types";
import { Button, Card, Field, Loading, Screen, colors } from "../ui";

type LedgerRes = {
  income: BalanceSheetItem[];
  expenses: BalanceSheetItem[];
  totalIncome: number;
  totalExpense: number;
};

export function LedgerScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<LedgerRes | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setData(await api<LedgerRes>("/api/ledger"));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
    }, [load]),
  );

  async function add(type: "extra_income" | "expense") {
    try {
      setBusy(true);
      await api("/api/ledger", {
        method: "POST",
        body: JSON.stringify({
          type,
          title,
          amount: Number(amount),
          date,
          note,
          createdBy: user?.name ?? "Admin",
        }),
      });
      setTitle("");
      setAmount("");
      setNote("");
      await load();
    } catch (err) {
      Alert.alert("Could not save", err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <Loading />;

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>
        Extra income / expense
      </Text>
      <Card>
        <Field label="Title" value={title} onChangeText={setTitle} />
        <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <Field label="Note" value={note} onChangeText={setNote} />
        <Button
          title={busy ? "Saving…" : "Add extra income"}
          color={colors.green}
          onPress={() => add("extra_income")}
          disabled={busy}
        />
        <Button
          title={busy ? "Saving…" : "Add expense"}
          color={colors.red}
          onPress={() => add("expense")}
          disabled={busy}
        />
      </Card>
      <Text style={{ fontWeight: "700", marginTop: 8 }}>
        Income {formatCurrency(data.totalIncome)}
      </Text>
      {data.income.slice(0, 20).map((i) => (
        <Card key={i.id}>
          <Text style={{ fontWeight: "600" }}>{i.label}</Text>
          <Text>
            {formatCurrency(i.amount)} · {formatDate(i.date)}
          </Text>
        </Card>
      ))}
      <Text style={{ fontWeight: "700", marginTop: 8 }}>
        Expense {formatCurrency(data.totalExpense)}
      </Text>
      {data.expenses.slice(0, 20).map((i) => (
        <Card key={i.id}>
          <Text style={{ fontWeight: "600" }}>{i.label}</Text>
          <Text>
            {formatCurrency(i.amount)} · {formatDate(i.date)}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
