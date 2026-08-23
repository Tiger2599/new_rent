import { useCallback, useState } from "react";
import { FlatList, Text, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../lib/api";
import { formatCurrency } from "../lib/format";
import type { Tenant } from "../types";
import { Button, Card, Loading, Screen, colors } from "../ui";
import type { TenantsStackParamList } from "../navigation";

type Props = NativeStackScreenProps<TenantsStackParamList, "TenantList">;

export function TenantsScreen({ navigation }: Props) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await api<{ tenants: Tenant[] }>("/api/tenants");
    setTenants(res.tenants);
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
      <Button title="Add tenant" onPress={() => navigation.navigate("TenantAdd")} />
      <FlatList
        data={tenants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={{ color: colors.muted, marginTop: 20 }}>No tenants yet.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("TenantDetail", { id: item.id })}
          >
            <Card>
              <Text style={{ fontSize: 16, fontWeight: "700" }}>{item.name}</Text>
              <Text style={{ color: colors.muted }}>
                {item.buildingNumber} / {item.roomNumber} · {item.mobile}
              </Text>
              <Text style={{ marginTop: 4 }}>{formatCurrency(item.rent)} / month</Text>
            </Card>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}
