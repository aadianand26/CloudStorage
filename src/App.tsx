import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Landing } from "./pages/Landing";
import Documents from "./pages/Documents";
import Images from "./pages/Images";
import Pricing from "./pages/Pricing";
import Shared from "./pages/Shared";
import Recent from "./pages/Recent";
import Starred from "./pages/Starred";
import Trash from "./pages/Trash";
import AiAssistant from "./pages/AiAssistant";
import SmartSearch from "./pages/SmartSearch";
import Sync from "./pages/Sync";
import Security from "./pages/Security";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import SharedView from "./pages/SharedView";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  // Public routes that don't need auth check
  const isPublicRoute = window.location.pathname.startsWith('/share');

  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Routes>
        {/* Public route - no auth required */}
        <Route path="/share" element={<SharedView />} />
        
        <Route path="/" element={user ? <ProtectedRoute><Index /></ProtectedRoute> : <Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/documents" element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        } />
        <Route path="/images" element={
          <ProtectedRoute>
            <Images />
          </ProtectedRoute>
        } />
        <Route path="/pricing" element={
          <ProtectedRoute>
            <Pricing />
          </ProtectedRoute>
        } />
        <Route path="/shared" element={
          <ProtectedRoute>
            <Shared />
          </ProtectedRoute>
        } />
        <Route path="/recent" element={
          <ProtectedRoute>
            <Recent />
          </ProtectedRoute>
        } />
        <Route path="/starred" element={
          <ProtectedRoute>
            <Starred />
          </ProtectedRoute>
        } />
        <Route path="/trash" element={
          <ProtectedRoute>
            <Trash />
          </ProtectedRoute>
        } />
        <Route path="/ai-assistant" element={
          <ProtectedRoute>
            <AiAssistant />
          </ProtectedRoute>
        } />
        <Route path="/smart-search" element={
          <ProtectedRoute>
            <SmartSearch />
          </ProtectedRoute>
        } />
        <Route path="/sync" element={
          <ProtectedRoute>
            <Sync />
          </ProtectedRoute>
        } />
        <Route path="/security" element={
          <ProtectedRoute>
            <Security />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/help" element={
          <ProtectedRoute>
            <Help />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
