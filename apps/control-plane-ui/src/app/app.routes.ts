import type { Routes } from "@angular/router";

import { AccessTokensPageComponent } from "./features/access-tokens/access-tokens-page.component";
import { ProviderKeysPageComponent } from "./features/provider-keys/provider-keys-page.component";
import { ServerStatsPageComponent } from "./features/server-stats/server-stats-page.component";
import { TokenUsagePageComponent } from "./features/token-usage/token-usage-page.component";

/** Application routes for feature pages. */
export const appRoutes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "stats" },
  { path: "stats", component: ServerStatsPageComponent },
  { path: "usage", component: TokenUsagePageComponent },
  { path: "tokens", component: AccessTokensPageComponent },
  { path: "providers", component: ProviderKeysPageComponent },
];
