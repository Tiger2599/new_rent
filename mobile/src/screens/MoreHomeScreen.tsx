import { Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Card, Screen, colors } from "../ui";
import type { MoreStackParamList } from "../navigation";

type Props = NativeStackScreenProps<MoreStackParamList, "MoreHome">;

function Row({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Card>
        <Text style={{ fontWeight: "600", fontSize: 16 }}>{title}</Text>
      </Card>
    </TouchableOpacity>
  );
}

export function MoreHomeScreen({ navigation }: Props) {
  return (
    <Screen>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>More</Text>
      <Row title="Extra income / expense" onPress={() => navigation.navigate("Ledger")} />
      <Row title="Team" onPress={() => navigation.navigate("Team")} />
      <Row title="Settings" onPress={() => navigation.navigate("Settings")} />
      <View style={{ height: 8 }} />
      <Text style={{ color: colors.muted, fontSize: 12 }}>
        Website stays as it is. This app uses the same Next.js APIs.
      </Text>
    </Screen>
  );
}
