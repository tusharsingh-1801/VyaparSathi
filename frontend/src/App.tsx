import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { ProfileProvider, useProfile } from "./context/ProfileContext";
import { AppShell } from "./layout/AppShell";
import { ProfileSetupPage } from "./pages/ProfileSetupPage";
import { HomePage } from "./pages/HomePage";
import { AdvisoryPage } from "./pages/AdvisoryPage";
import { ReportsListPage } from "./pages/ReportsListPage";
import { ReportDetailPage } from "./pages/ReportDetailPage";
import { DiscoveryPage } from "./pages/DiscoveryPage";
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
          <Route path="/" element={<HomePage />} />
          <Route path="/advisory" element={<AdvisoryPage />} />
          <Route path="/reports" element={<ReportsListPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
          <Route path="/discovery" element={<DiscoveryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ProfileProvider>
      <Gate />
    </ProfileProvider>
  );
}

export default App;
