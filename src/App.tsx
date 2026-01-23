
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAutoRefreshUser } from "./hooks/useAutoRefreshUser";
import AIAssistant from "./components/ai/AIAssistant";
import Index from "./pages/Index";
import Simulator from "./pages/Simulator";
import Club from "./pages/Club";
import BlogPost from "./pages/BlogPost";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Admin from "./pages/Admin";
import Diagnostics from "./pages/Diagnostics";
import DiagnosticsResults from "./pages/DiagnosticsResults";
import Profile from "./pages/Profile";
import BookingCalendar from "./pages/BookingCalendar";
import AdditionalServices from "./pages/AdditionalServices";
import Customers from "./pages/Customers";
import BotSettings from "./pages/BotSettings";
import SyncGuide from "./pages/SyncGuide";
import Pricing from "./pages/Pricing";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFail from "./pages/PaymentFail";
import Oferta from "./pages/Oferta";
import Roadmap from "./pages/Roadmap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  useAutoRefreshUser();
  
  const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
  const isLoggedIn = !!userStr;
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/club" element={<Club />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/diagnostics" element={<Diagnostics />} />
        <Route path="/diagnostics/results" element={<DiagnosticsResults />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/booking-calendar" element={<BookingCalendar />} />
        <Route path="/additional-services" element={<AdditionalServices />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/bot-settings" element={<BotSettings />} />
        <Route path="/sync-guide" element={<SyncGuide />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/fail" element={<PaymentFail />} />
        <Route path="/oferta" element={<Oferta />} />
        <Route path="/roadmap" element={<Roadmap />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {isLoggedIn && <AIAssistant />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;