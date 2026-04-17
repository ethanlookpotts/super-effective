import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "~/components/shell";
import { GymsRoute } from "~/routes/gyms";
import { PartyRoute } from "~/routes/party";
import { SearchRoute } from "~/routes/search";
import { SettingsRoute } from "~/routes/settings";
import { TmsRoute } from "~/routes/tms";
import { WhereAmIRoute } from "~/routes/where-am-i";

export function AppRoutes() {
  return (
    <HashRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<SearchRoute />} />
          <Route path="/party" element={<PartyRoute />} />
          <Route path="/gyms" element={<GymsRoute />} />
          <Route path="/where" element={<WhereAmIRoute />} />
          <Route path="/tms" element={<TmsRoute />} />
          <Route path="/settings" element={<SettingsRoute />} />
          <Route path="*" element={<Navigate to="/search" replace />} />
        </Routes>
      </Shell>
    </HashRouter>
  );
}
