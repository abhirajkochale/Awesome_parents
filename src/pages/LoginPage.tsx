import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export default function LoginPage() {
  const { login, signup, loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await login(email, password);

    if (error) {
      setError(error.message || 'Login failed. Please check your credentials.');
    }

    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      setIsLoading(false);
      return;
    }

    const { error } = await signup(email, password, username);

    if (error) {
      setError(error.message || 'Signup failed. Please try again.');
    } else {
      setSuccess('Account created successfully! You can now login.');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Hero / Branding Section (Hidden on small screens) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-zinc-900 p-10 text-white relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-purple-600/30 object-cover z-0" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/40 rounded-full blur-3xl opacity-50 z-0" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-600/40 rounded-full blur-3xl opacity-50 z-0" />

        <div className="relative z-10 flex items-center gap-2">
          <img src="/AwesomeKids_logo.jpeg" alt="AwesomeKids Logo" className="h-12 w-auto object-contain rounded-md shadow-sm bg-white p-1" />
          <span className="text-xl font-bold tracking-tight">AwesomeKids</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 max-w-lg mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Welcome to the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              AwesomeKids Family
            </span>
          </h1>
          <p className="text-lg text-zinc-300 leading-relaxed">
            Your single destination to manage admissions, track fee payments, and stay updated with your child's journey.
          </p>
        </motion.div>

        <div className="relative z-10 text-sm text-zinc-400">
          &copy; {new Date().getFullYear()} AwesomeKids Preschool. All rights reserved.
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        <div className="absolute top-8 right-8 z-50">
          <ThemeToggle />
        </div>
        
        <div className="w-full max-w-md space-y-8 relative">
          
          {/* Mobile Logo Header */}
          <div className="flex lg:hidden flex-col items-center text-center space-y-4 mb-8">
            <img src="/AwesomeKids_logo.jpeg" alt="Awesome Kids Logo" className="h-20 w-auto object-contain dark:invert-[0.05] dark:brightness-90 rounded-xl" />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Parent Portal</h1>
              <p className="text-sm text-muted-foreground">Log in to your account</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-none sm:border sm:shadow-sm bg-transparent sm:bg-card">
              <CardHeader className="hidden sm:block space-y-1 text-center px-0 sm:px-6">
                <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials below to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 sm:px-6 pb-6">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-muted/50 rounded-lg">
                    <TabsTrigger value="login" className="rounded-md transition-all font-medium py-2">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-md transition-all font-medium py-2">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-0">
                    <form onSubmit={handleLogin} className="space-y-4">
                      {error && (
                        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          name="email"
                          type="email"
                          placeholder="name@example.com"
                          required
                          disabled={isLoading}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password">Password</Label>
                          <a href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                            Forgot password?
                          </a>
                        </div>
                        <Input
                          id="login-password"
                          name="password"
                          type="password"
                          required
                          disabled={isLoading}
                          className="h-11"
                        />
                      </div>

                      <Button type="submit" className="w-full h-11 text-base font-medium shadow-sm" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                      </Button>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-muted-foreground/20" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background sm:bg-card px-2 text-muted-foreground font-medium">
                            Or continue with
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        type="button"
                        className="w-full h-11 font-medium bg-background text-foreground hover:bg-muted"
                        disabled={isLoading}
                        onClick={async () => {
                          setIsLoading(true);
                          await loginWithGoogle();
                          setIsLoading(false);
                        }}
                      >
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                          <path d="M1 1h22v22H1z" fill="none" />
                        </svg>
                        Sign in with Google
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-0">
                    <form onSubmit={handleSignup} className="space-y-4">
                      {error && (
                        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      {success && (
                        <Alert className="bg-emerald-50 text-emerald-800 border-emerald-200 animate-in fade-in slide-in-from-top-2">
                          <AlertDescription>{success}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          placeholder="name@example.com"
                          required
                          disabled={isLoading}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-username">Username</Label>
                        <Input
                          id="signup-username"
                          name="username"
                          type="text"
                          placeholder="Choose a screen name"
                          required
                          disabled={isLoading}
                          className="h-11"
                        />
                        <p className="text-[11px] text-muted-foreground tracking-wide font-medium uppercase">
                          Letters, numbers, underscores only
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">Password</Label>
                          <Input
                            id="signup-password"
                            name="password"
                            type="password"
                            required
                            disabled={isLoading}
                            minLength={6}
                            className="h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-confirm-password">Confirm</Label>
                          <Input
                            id="signup-confirm-password"
                            name="confirmPassword"
                            type="password"
                            required
                            disabled={isLoading}
                            minLength={6}
                            className="h-11"
                          />
                        </div>
                      </div>

                      <Button type="submit" className="w-full h-11 text-base font-medium shadow-sm mt-2" disabled={isLoading}>
                        {isLoading ? 'Creating account...' : 'Create Account'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
