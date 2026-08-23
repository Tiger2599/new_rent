import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { TenantsScreen } from "./src/screens/TenantsScreen";
import { TenantFormScreen } from "./src/screens/TenantFormScreen";
import { TenantDetailScreen } from "./src/screens/TenantDetailScreen";
import { TenantEditScreen } from "./src/screens/TenantEditScreen";
import { ReceiveRentScreen } from "./src/screens/ReceiveRentScreen";
import { PendingRentScreen } from "./src/screens/PendingRentScreen";
import { MoreHomeScreen } from "./src/screens/MoreHomeScreen";
import { LedgerScreen } from "./src/screens/LedgerScreen";
import { TeamScreen } from "./src/screens/TeamScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { Loading } from "./src/ui";
import type {
  AuthStackParamList,
  MoreStackParamList,
  RootTabParamList,
  TenantsStackParamList,
} from "./src/navigation";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();
const TenantsStack = createNativeStackNavigator<TenantsStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();

function TenantsNavigator() {
  return (
    <TenantsStack.Navigator>
      <TenantsStack.Screen
        name="TenantList"
        component={TenantsScreen}
        options={{ title: "Tenants" }}
      />
      <TenantsStack.Screen name="TenantAdd" component={TenantFormScreen} options={{ title: "Add tenant" }} />
      <TenantsStack.Screen name="TenantDetail" component={TenantDetailScreen} options={{ title: "Tenant" }} />
      <TenantsStack.Screen name="TenantEdit" component={TenantEditScreen} options={{ title: "Edit tenant" }} />
      <TenantsStack.Screen name="ReceiveRent" component={ReceiveRentScreen} options={{ title: "Receive" }} />
    </TenantsStack.Navigator>
  );
}

function MoreNavigator() {
  return (
    <MoreStack.Navigator>
      <MoreStack.Screen name="MoreHome" component={MoreHomeScreen} options={{ title: "More" }} />
      <MoreStack.Screen name="Ledger" component={LedgerScreen} options={{ title: "Ledger" }} />
      <MoreStack.Screen name="Team" component={TeamScreen} options={{ title: "Team" }} />
      <MoreStack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
    </MoreStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: "Home", headerShown: true }} />
      <Tab.Screen name="Tenants" component={TenantsNavigator} />
      <Tab.Screen name="Pending" component={PendingRentScreen} options={{ title: "Pending", headerShown: true }} />
      <Tab.Screen name="More" component={MoreNavigator} />
    </Tab.Navigator>
  );
}

function Root() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;

  return (
    <NavigationContainer>
      {user ? (
        <MainTabs />
      ) : (
        <AuthStack.Navigator>
          <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: "Register" }} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
