import { useCallback, useState } from "react";
import { FlatList, Text, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { api } from "../lib/api";
import { formatCurrency } from "../lib/format";
import type { PendingRentRow } from "../types";
import { Card, Loading, Screen, colors } from "../ui";
import type { RootTabParamList } from "../navigation";

export function PendingRentScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [items, setItems] = useState<PendingRentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await api<{ items: PendingRentRow[]; totalAmount: number }>(
      "/api/tenants/pending-rent",
    );
    setItems(res.items);
    setTotal(res.totalAmount);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load]),
  );

  if (loading) return <Loading />;

  return (
    <Screen scroll={false}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Pending rent</Text>
      <Text style={{ color: colors.muted, marginBottom: 12 }}>
        {items.length} tenants · {formatCurrency(total)}
      </Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={{ color: colors.muted }}>No pending rent.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Tenants", {
                screen: "ReceiveRent",
                params: { id: item.tenantId },
              })
            }
          >
            <Card>
              <Text style={{ fontWeight: "700" }}>{item.tenantName}</Text>
              <Text style={{ color: colors.muted }}>
                {item.buildingNumber} / {item.roomNumber} · {item.monthsLabel}
              </Text>
              <Text style={{ marginTop: 4 }}>{formatCurrency(item.amount)}</Text>
            </Card>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}
