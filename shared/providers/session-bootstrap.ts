import type { AuthControllerMeQueryResult } from "@/shared/api/generated/react-query";

export interface SessionBootstrapState {
  authData: AuthControllerMeQueryResult | null;
  csrfCookiePresent: boolean;
  resolved: boolean;
}
