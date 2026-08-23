import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type TenantsStackParamList = {
  TenantList: undefined;
  TenantAdd: undefined;
  TenantDetail: { id: string };
  TenantEdit: { id: string };
  ReceiveRent: { id: string };
};

export type MoreStackParamList = {
  MoreHome: undefined;
  Ledger: undefined;
  Team: undefined;
  Settings: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Tenants: NavigatorScreenParams<TenantsStackParamList>;
  Pending: undefined;
  More: NavigatorScreenParams<MoreStackParamList>;
};
