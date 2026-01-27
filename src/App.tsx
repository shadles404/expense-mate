import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Schedule from "./pages/Schedule";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
// TikTok Managing Pages
import TikTokDashboard from "./pages/tiktok/TikTokDashboard";
import TikTokRegistration from "./pages/tiktok/TikTokRegistration";
import TikTokTracking from "./pages/tiktok/TikTokTracking";
import TikTokDelivery from "./pages/tiktok/TikTokDelivery";
import TikTokPayment from "./pages/tiktok/TikTokPayment";
import TikTokReports from "./pages/tiktok/TikTokReports";
import TikTokSettings from "./pages/tiktok/TikTokSettings";

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
          {/* TikTok Managing Routes */}
          <Route path="/tiktok" element={<ProtectedRoute><TikTokDashboard /></ProtectedRoute>} />
          <Route path="/tiktok/registration" element={<ProtectedRoute><TikTokRegistration /></ProtectedRoute>} />
          <Route path="/tiktok/tracking" element={<ProtectedRoute><TikTokTracking /></ProtectedRoute>} />
          <Route path="/tiktok/delivery" element={<ProtectedRoute><TikTokDelivery /></ProtectedRoute>} />
          <Route path="/tiktok/payment" element={<ProtectedRoute><TikTokPayment /></ProtectedRoute>} />
          <Route path="/tiktok/reports" element={<ProtectedRoute><TikTokReports /></ProtectedRoute>} />
          <Route path="/tiktok/settings" element={<ProtectedRoute><TikTokSettings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
