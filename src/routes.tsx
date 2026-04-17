import { Suspense, lazy } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "~/components/shell";

const SearchRoute = lazy(() => import("~/routes/search").then((m) => ({ default: m.SearchRoute })));
const PartyRoute = lazy(() => import("~/routes/party").then((m) => ({ default: m.PartyRoute })));
const GymsRoute = lazy(() => import("~/routes/gyms").then((m) => ({ default: m.GymsRoute })));
const WhereAmIRoute = lazy(() =>
  import("~/routes/where-am-i").then((m) => ({ default: m.WhereAmIRoute })),
);
const TmsRoute = lazy(() => import("~/routes/tms").then((m) => ({ default: m.TmsRoute })));
const SettingsRoute = lazy(() =>
  import("~/routes/settings").then((m) => ({ default: m.SettingsRoute })),
);

function RouteFallback() {
  return (
    <div aria-label="Loading" className="p-4 text-xs text-[var(--color-text-3)]">
      Loading…
    </div>
  );
}

export function AppRoutes() {
  return (
    <HashRouter>
      <Shell>
        <Suspense fallback={<RouteFallback />}>
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
        </Suspense>
      </Shell>
    </HashRouter>
  );
}
