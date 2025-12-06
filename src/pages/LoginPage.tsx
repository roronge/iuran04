import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Home, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, role, loading, signIn, signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', fullName: '' });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-light to-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    if (role) {
      const redirectPath = role === 'super_admin' ? '/superadmin' : role === 'admin' ? '/admin' : '/warga';
      return <Navigate to={redirectPath} replace />;
    }
    // Role masih loading, tampilkan loader
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-light to-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signIn(loginForm.email, loginForm.password);

    if (error) {
      toast.error('Login gagal', {
        description: error.message === 'Invalid login credentials'
          ? 'Email atau password salah'
          : error.message,
      });
    } else {
      toast.success('Berhasil masuk!');
    }
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signUp(
      registerForm.email,
      registerForm.password,
      registerForm.fullName
    );

    if (error) {
      toast.error('Pendaftaran gagal', {
        description: error.message,
      });
    } else {
      toast.success('Pendaftaran berhasil!', {
        description: 'Silakan login dengan akun baru Anda',
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-light via-background to-cyan-light">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-lg mb-4">
            RT
          </div>
          <h1 className="text-2xl font-bold text-foreground">Iuran RT</h1>
          <p className="text-muted-foreground mt-1">Sistem Pengelolaan Kas & Tagihan Warga</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg">Selamat Datang</CardTitle>
            <CardDescription className="text-center">
              Silakan masuk atau daftar untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Home className="h-4 w-4 mr-2" />
                    )}
                    Masuk
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nama Lengkap</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Nama Anda"
                      value={registerForm.fullName}
                      onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      minLength={6}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Daftar
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Akun warga akan otomatis terhubung dengan data rumah berdasarkan email yang didaftarkan
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
