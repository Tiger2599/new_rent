import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../lib/api";
import { formatCurrency } from "../lib/format";
import { Card, Loading, Screen, colors } from "../ui";

type Dashboard = {
  rangeLabel: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  electricityUnits: number;
  electricityAmount: number;
};

export function DashboardScreen() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await api<Dashboard>("/api/ledger");
    setData(res);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().catch(() => setData(null)).finally(() => setLoading(false));
    }, [load]),
  );

  if (loading && !data) return <Loading />;

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 4 }}>
        This month
      </Text>
      <Text style={{ color: colors.muted, marginBottom: 16 }}>
        {data?.rangeLabel ?? ""}
      </Text>
      <Card>
        <Text style={{ color: colors.muted }}>Income</Text>
        <Text style={{ fontSize: 24, fontWeight: "700", color: colors.green }}>
          {formatCurrency(data?.totalIncome ?? 0)}
        </Text>
      </Card>
      <Card>
        <Text style={{ color: colors.muted }}>Expense</Text>
        <Text style={{ fontSize: 24, fontWeight: "700", color: colors.red }}>
          {formatCurrency(data?.totalExpense ?? 0)}
        </Text>
      </Card>
      <Card>
        <Text style={{ color: colors.muted }}>Balance</Text>
        <Text style={{ fontSize: 24, fontWeight: "700" }}>
          {formatCurrency(data?.balance ?? 0)}
        </Text>
      </Card>
      <Card>
        <Text style={{ color: colors.muted }}>Electricity this month</Text>
        <Text style={{ fontSize: 16, fontWeight: "600", marginTop: 4 }}>
          {data?.electricityUnits ?? 0} units · {formatCurrency(data?.electricityAmount ?? 0)}
        </Text>
      </Card>
    </Screen>
  );
}
