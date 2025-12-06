import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import DataRumahPage from "./pages/admin/DataRumahPage";
import KategoriIuranPage from "./pages/admin/KategoriIuranPage";
import GenerateTagihanPage from "./pages/admin/GenerateTagihanPage";
import DaftarTagihanPage from "./pages/admin/DaftarTagihanPage";
import BukuKasPage from "./pages/admin/BukuKasPage";
import LaporanIuranPage from "./pages/admin/LaporanIuranPage";
import WargaDashboard from "./pages/warga/WargaDashboard";
import WargaTagihanPage from "./pages/warga/WargaTagihanPage";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import ManageRTPage from "./pages/superadmin/ManageRTPage";
import ManageAdminPage from "./pages/superadmin/ManageAdminPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

type AllowedRole = 'admin' | 'warga' | 'super_admin';

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: AllowedRole }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    const redirectPath = role === 'super_admin' ? '/superadmin' : role === 'admin' ? '/admin' : '/warga';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Super Admin Routes */}
      <Route path="/superadmin" element={<ProtectedRoute allowedRole="super_admin"><SuperAdminDashboard /></ProtectedRoute>} />
      <Route path="/superadmin/rt" element={<ProtectedRoute allowedRole="super_admin"><ManageRTPage /></ProtectedRoute>} />
      <Route path="/superadmin/admin" element={<ProtectedRoute allowedRole="super_admin"><ManageAdminPage /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/rumah" element={<ProtectedRoute allowedRole="admin"><DataRumahPage /></ProtectedRoute>} />
      <Route path="/admin/kategori" element={<ProtectedRoute allowedRole="admin"><KategoriIuranPage /></ProtectedRoute>} />
      <Route path="/admin/generate" element={<ProtectedRoute allowedRole="admin"><GenerateTagihanPage /></ProtectedRoute>} />
      <Route path="/admin/tagihan" element={<ProtectedRoute allowedRole="admin"><DaftarTagihanPage /></ProtectedRoute>} />
      <Route path="/admin/kas" element={<ProtectedRoute allowedRole="admin"><BukuKasPage /></ProtectedRoute>} />
      <Route path="/admin/laporan" element={<ProtectedRoute allowedRole="admin"><LaporanIuranPage /></ProtectedRoute>} />
      
      {/* Warga Routes */}
      <Route path="/warga" element={<ProtectedRoute allowedRole="warga"><WargaDashboard /></ProtectedRoute>} />
      <Route path="/warga/tagihan" element={<ProtectedRoute allowedRole="warga"><WargaTagihanPage /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
