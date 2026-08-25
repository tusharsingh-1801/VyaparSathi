import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { LanguageProvider } from "./i18n/LanguageContext";
import { AppShell } from "./layout/AppShell";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BusinessDiscoveryPage } from "./pages/BusinessDiscoveryPage";
import { MarketIntelligencePage } from "./pages/MarketIntelligencePage";
import { FinancialPlannerPage } from "./pages/FinancialPlannerPage";
import { GovernmentSchemesPage } from "./pages/GovernmentSchemesPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { AIAdvisorPage } from "./pages/AIAdvisorPage";
import { ReportsListPage } from "./pages/ReportsListPage";
import { ReportDetailPage } from "./pages/ReportDetailPage";
import { ProfilePage } from "./pages/ProfilePage";

function Gate() {
  const { applicant, loading } = useProfile();

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading...</p>
      </div>
    );
  }

  if (!applicant) {
    return <ProfileSetupPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/discovery" element={<BusinessDiscoveryPage />} />
          <Route path="/market" element={<MarketIntelligencePage />} />
          <Route path="/financial" element={<FinancialPlannerPage />} />
          <Route path="/schemes" element={<GovernmentSchemesPage />} />
          <Route
            path="/stress"
            element={<ComingSoonPage titleKey="nav.stress" bodyKey="comingSoon.stress.body" />}
          />
          <Route
            path="/report"
            element={<ComingSoonPage titleKey="nav.report" bodyKey="comingSoon.report.body" />}
          />
          <Route path="/advisor" element={<AIAdvisorPage />} />
          <Route path="/reports" element={<ReportsListPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ProfileProvider>
        <Gate />
      </ProfileProvider>
    </LanguageProvider>
  );
}

export default App;
