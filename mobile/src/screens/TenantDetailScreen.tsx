import { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../lib/api";
import { formatCurrency, formatDate, formatMonth } from "../lib/format";
import type { RentPayment, Tenant } from "../types";
import { Button, Card, Loading, Screen, colors } from "../ui";
import type { TenantsStackParamList } from "../navigation";

type Props = NativeStackScreenProps<TenantsStackParamList, "TenantDetail">;

type RentInfo = {
  payments: RentPayment[];
  pendingMonths: string[];
  pendingRemaining: Record<string, number>;
  pendingDeposit: number;
  lastElectricityUnits: number;
  electricityRate: number;
};

export function TenantDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [rent, setRent] = useState<RentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [t, r] = await Promise.all([
      api<{ tenant: Tenant }>(`/api/tenants/${id}`),
      api<RentInfo>(`/api/tenants/${id}/rent`),
    ]);
    setTenant(t.tenant);
    setRent(r);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch((err) => Alert.alert("Error", err instanceof Error ? err.message : "Error"))
        .finally(() => setLoading(false));
    }, [load]),
  );

  if (loading || !tenant || !rent) return <Loading />;

  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>{tenant.name}</Text>
      <Text style={{ color: colors.muted, marginBottom: 12 }}>
        {tenant.buildingNumber} / {tenant.roomNumber} · {tenant.mobile}
      </Text>
      <Card>
        <Text>Rent {formatCurrency(tenant.rent)}</Text>
        <Text>Deposit {formatCurrency(tenant.deposit)}</Text>
        <Text>Last units {rent.lastElectricityUnits} · rate {rent.electricityRate}</Text>
        {rent.pendingDeposit > 0 ? (
          <Text style={{ color: colors.red, marginTop: 6 }}>
            Pending deposit {formatCurrency(rent.pendingDeposit)}
          </Text>
        ) : null}
      </Card>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button title="Receive" onPress={() => navigation.navigate("ReceiveRent", { id })} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Edit"
            color="#374151"
            onPress={() => navigation.navigate("TenantEdit", { id })}
          />
        </View>
      </View>
      <Text style={{ fontWeight: "700", marginTop: 16, marginBottom: 8 }}>Pending months</Text>
      {rent.pendingMonths.length === 0 ? (
        <Text style={{ color: colors.muted }}>None</Text>
      ) : (
        rent.pendingMonths.map((m) => (
          <Text key={m}>
            {formatMonth(m)} · {formatCurrency(rent.pendingRemaining[m] ?? 0)}
          </Text>
        ))
      )}
      <Text style={{ fontWeight: "700", marginTop: 16, marginBottom: 8 }}>History</Text>
      {rent.payments.map((p) => (
        <Card key={p.id}>
          <Text style={{ fontWeight: "600" }}>
            {p.type} · {formatCurrency(p.amount)}
          </Text>
          <Text style={{ color: colors.muted }}>{formatDate(p.receivedDate)}</Text>
          {p.electricityCharge ? (
            <Text>
              Units {(p.previousElectricityUnits ?? 0)} → {p.electricityUnits} ·{" "}
              {formatCurrency(p.electricityCharge)}
            </Text>
          ) : null}
          {p.note ? <Text>{p.note}</Text> : null}
        </Card>
      ))}
    </Screen>
  );
}
