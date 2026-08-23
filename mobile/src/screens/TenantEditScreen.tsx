import { useEffect, useState } from "react";
import { Alert, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { api } from "../lib/api";
import type { Tenant } from "../types";
import { Button, Card, Field, Loading, Screen } from "../ui";
import type { TenantsStackParamList } from "../navigation";

type Props = NativeStackScreenProps<TenantsStackParamList, "TenantEdit">;

export function TenantEditScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ tenant: Tenant }>(`/api/tenants/${id}`)
      .then((res) => setTenant(res.tenant))
      .catch((err) => Alert.alert("Error", err instanceof Error ? err.message : "Error"));
  }, [id]);

  if (!tenant) return <Loading />;

  async function onSave() {
    try {
      setBusy(true);
      await api(`/api/tenants/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: tenant.name,
          mobile: tenant.mobile,
          buildingNumber: tenant.buildingNumber,
          roomNumber: tenant.roomNumber,
          deposit: tenant.deposit,
          advance: tenant.advance,
          rent: tenant.rent,
          rentStartFrom: tenant.rentStartFrom,
          electricityUnits: tenant.electricityUnits ?? 0,
          note: tenant.note,
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
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>Edit tenant</Text>
      <Card>
        <Field label="Name" value={tenant.name} onChangeText={(v) => setTenant({ ...tenant, name: v })} />
        <Field
          label="Mobile"
          value={tenant.mobile}
          onChangeText={(v) => setTenant({ ...tenant, mobile: v })}
          keyboardType="phone-pad"
        />
        <Field
          label="Building"
          value={tenant.buildingNumber}
          onChangeText={(v) => setTenant({ ...tenant, buildingNumber: v })}
        />
        <Field
          label="Room"
          value={tenant.roomNumber}
          onChangeText={(v) => setTenant({ ...tenant, roomNumber: v })}
        />
        <Field
          label="Monthly rent"
          value={String(tenant.rent)}
          onChangeText={(v) => setTenant({ ...tenant, rent: Number(v) || 0 })}
          keyboardType="numeric"
        />
        <Field
          label="Deposit"
          value={String(tenant.deposit)}
          onChangeText={(v) => setTenant({ ...tenant, deposit: Number(v) || 0 })}
          keyboardType="numeric"
        />
        <Field
          label="Last electricity units"
          value={String(tenant.electricityUnits ?? 0)}
          onChangeText={(v) => setTenant({ ...tenant, electricityUnits: Number(v) || 0 })}
          keyboardType="numeric"
        />
        <Field label="Note" value={tenant.note} onChangeText={(v) => setTenant({ ...tenant, note: v })} />
        <Button title={busy ? "Saving…" : "Save"} onPress={onSave} disabled={busy} />
      </Card>
    </Screen>
  );
}
