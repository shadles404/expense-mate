import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute, TikTokSectionRoute } from "@/components/auth/AdminRoute";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Schedule from "./pages/Schedule";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import TikTokDashboard from "./pages/tiktok/TikTokDashboard";
import TikTokInfluencers from "./pages/tiktok/TikTokInfluencers";
import TikTokTracking from "./pages/tiktok/TikTokTracking";
import TikTokDelivery from "./pages/tiktok/TikTokDelivery";
import TikTokPayments from "./pages/tiktok/TikTokPayments";
import TikTokReports from "./pages/tiktok/TikTokReports";
import TikTokSettingsPage from "./pages/tiktok/TikTokSettings";
import AdminSettings from "./pages/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
          {/* Admin Settings */}
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          {/* TikTok routes — Admin or permitted sub-users */}
          <Route path="/tiktok" element={<ProtectedRoute><TikTokSectionRoute sectionKey="tiktok_dashboard"><TikTokDashboard /></TikTokSectionRoute></ProtectedRoute>} />
          <Route path="/tiktok/influencers" element={<ProtectedRoute><TikTokSectionRoute sectionKey="tiktok_influencers"><TikTokInfluencers /></TikTokSectionRoute></ProtectedRoute>} />
          <Route path="/tiktok/tracking" element={<ProtectedRoute><TikTokSectionRoute sectionKey="tiktok_tracking"><TikTokTracking /></TikTokSectionRoute></ProtectedRoute>} />
          <Route path="/tiktok/delivery" element={<ProtectedRoute><TikTokSectionRoute sectionKey="tiktok_delivery"><TikTokDelivery /></TikTokSectionRoute></ProtectedRoute>} />
          <Route path="/tiktok/payments" element={<ProtectedRoute><TikTokSectionRoute sectionKey="tiktok_payments"><TikTokPayments /></TikTokSectionRoute></ProtectedRoute>} />
          <Route path="/tiktok/reports" element={<ProtectedRoute><TikTokSectionRoute sectionKey="tiktok_reports"><TikTokReports /></TikTokSectionRoute></ProtectedRoute>} />
          <Route path="/tiktok/settings" element={<ProtectedRoute><TikTokSectionRoute sectionKey="tiktok_settings"><TikTokSettingsPage /></TikTokSectionRoute></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

