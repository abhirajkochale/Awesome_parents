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
  const [activeTab, setActiveTab] = useState('login');

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
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-[#FDF8EE] p-10 text-zinc-800 relative overflow-hidden border-r border-zinc-200/50">
        <div className="flex items-start ml-2 mt-2 lg:ml-4 lg:mt-4">
          <img src="/AwesomeKids_logo.jpeg" alt="Awesome Kids Logo" className="h-[72px] lg:h-[80px] w-auto object-contain" style={{ mixBlendMode: 'multiply' }} />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 flex flex-col items-center justify-center w-full px-4 lg:px-8 py-8"
        >
          <div className="text-center z-20 mb-10">
            <h2 
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-wide text-[#2D3748] drop-shadow-sm leading-tight mb-4" 
              style={{ fontFamily: "'Fredoka', 'Quicksand', 'Nunito', sans-serif" }}
            >
              Family Connected Preschool
            </h2>
            <p className="text-base lg:text-lg text-[#4A5568] max-w-md mx-auto leading-relaxed">
              Empowering parents and engaging children with a modern approach to early childhood development.
            </p>
          </div>
          
          <div className="relative flex justify-center items-center w-full flex-1">
             <div className="absolute w-[320px] h-[320px] lg:w-[420px] lg:h-[420px] bg-[#FDE68A] rounded-full z-0 opacity-80 shadow-2xl shadow-yellow-500/10" />
             <img 
               src="/image_f0ce07.png" 
               alt="Preschool Illustration" 
               className="relative max-h-[50vh] xl:max-h-[60vh] max-w-[90%] w-auto object-contain mx-auto"
               style={{ mixBlendMode: 'multiply' }}
             />
          </div>
        </motion.div>

        <div className="relative z-10 text-sm text-[#718096]">
          &copy; {new Date().getFullYear()} AwesomeKids Preschool. All rights reserved.
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative min-h-screen overflow-y-auto">
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50">
          <ThemeToggle />
        </div>
        
        <div className="w-full max-w-md lg:max-w-lg mx-auto space-y-4 relative py-6">
          
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
              <CardHeader className="hidden sm:block space-y-1 text-center px-4 sm:px-6 pt-6 pb-2">
                <CardTitle className="text-3xl lg:text-4xl font-extrabold tracking-widest pb-1">
                  <span className="text-[#f4cd68]">s</span>
                  <span className="text-[#4ebda7]">i</span>
                  <span className="text-[#e5686d]">g</span>
                  <span className="text-[#8bcf9a]">n</span>
                  <span> </span>
                  {activeTab === 'login' ? (
                    <>
                      <span className="text-[#4ebda7]">i</span>
                      <span className="text-[#f4cd68]">n</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[#4ebda7]">u</span>
                      <span className="text-[#f4cd68]">p</span>
                    </>
                  )}
                  <span className="text-[#e5686d]">.</span>
                </CardTitle>
                <CardDescription className="hidden">
                  Enter your credentials below to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-6">
                <Tabs defaultValue="login" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 mb-4 h-11 lg:h-12 p-1 bg-muted/50 rounded-lg">
                    <TabsTrigger value="login" className="rounded-md transition-all font-medium py-1.5 lg:text-base">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-md transition-all font-medium py-1.5 lg:text-base">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="mt-0">
                    <form onSubmit={handleLogin} className="space-y-4">
                      {error && (
                        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-1">
                        <Label htmlFor="login-email" className="text-sm font-medium text-zinc-600 hover:text-zinc-800 cursor-pointer block">Email</Label>
                        <Input
                          id="login-email"
                          name="email"
                          type="email"
                          required
                          disabled={isLoading}
                          className="h-10 lg:h-11 lg:text-base border-solid border-x-0 border-t-0 border-b-2 border-zinc-500 hover:border-zinc-600 rounded-none bg-transparent px-2 !shadow-none !outline-none !ring-0 focus:!ring-0 focus-visible:!ring-0 focus-visible:!outline-none focus-visible:border-b-[#4ebda7] transition-all duration-300 text-zinc-800 cursor-text w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="login-password" className="text-sm font-medium text-zinc-600 hover:text-zinc-800 cursor-pointer block">Password</Label>
                        <Input
                          id="login-password"
                          name="password"
                          type="password"
                          required
                          disabled={isLoading}
                          className="h-10 lg:h-11 lg:text-base border-solid border-x-0 border-t-0 border-b-2 border-zinc-500 hover:border-zinc-600 rounded-none bg-transparent px-2 !shadow-none !outline-none !ring-0 focus:!ring-0 focus-visible:!ring-0 focus-visible:!outline-none focus-visible:border-b-[#4ebda7] transition-all duration-300 text-zinc-800 cursor-text w-full"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-8 pb-4">
                        <a href="/forgot-password" className="text-sm lg:text-base font-medium text-zinc-400 hover:text-zinc-600 transition-colors">
                          Forgotten password?
                        </a>
                        <Button type="submit" className="h-12 px-8 rounded-full bg-[#3eb4f0] hover:bg-[#3eb4f0]/90 text-white font-medium text-base lg:text-lg shadow-none transition-transform active:scale-[0.98]" disabled={isLoading}>
                          {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>
                      </div>

                      <div className="pt-2 pb-6">
                        <Button
                          variant="outline"
                          type="button"
                          className="w-full h-12 lg:h-14 rounded-full border border-zinc-200 text-base lg:text-lg font-medium bg-white text-zinc-700 hover:bg-zinc-50 shadow-none transition-transform active:scale-[0.98]"
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
                      </div>
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

                      <div className="space-y-1">
                        <Label htmlFor="signup-email" className="text-sm font-medium text-zinc-600 hover:text-zinc-800 cursor-pointer block">Email</Label>
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          required
                          disabled={isLoading}
                          className="h-10 lg:h-11 lg:text-base border-solid border-x-0 border-t-0 border-b-2 border-zinc-500 hover:border-zinc-600 rounded-none bg-transparent px-2 !shadow-none !outline-none !ring-0 focus:!ring-0 focus-visible:!ring-0 focus-visible:!outline-none focus-visible:border-b-[#4ebda7] transition-all duration-300 text-zinc-800 cursor-text w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="signup-username" className="text-sm font-medium text-zinc-600 hover:text-zinc-800 cursor-pointer block">Username</Label>
                        <Input
                          id="signup-username"
                          name="username"
                          type="text"
                          required
                          disabled={isLoading}
                          className="h-10 lg:h-11 lg:text-base border-solid border-x-0 border-t-0 border-b-2 border-zinc-500 hover:border-zinc-600 rounded-none bg-transparent px-2 !shadow-none !outline-none !ring-0 focus:!ring-0 focus-visible:!ring-0 focus-visible:!outline-none focus-visible:border-b-[#4ebda7] transition-all duration-300 text-zinc-800 cursor-text w-full"
                        />
                        <p className="text-[11px] text-muted-foreground tracking-wide font-medium uppercase mt-1 pl-2">
                          Letters/numbers only
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="signup-password" className="text-sm font-medium text-zinc-600 hover:text-zinc-800 cursor-pointer block">Password</Label>
                          <Input
                            id="signup-password"
                            name="password"
                            type="password"
                            required
                            disabled={isLoading}
                            minLength={6}
                            className="h-10 lg:h-11 lg:text-base border-solid border-x-0 border-t-0 border-b-2 border-zinc-500 hover:border-zinc-600 rounded-none bg-transparent px-2 !shadow-none !outline-none !ring-0 focus:!ring-0 focus-visible:!ring-0 focus-visible:!outline-none focus-visible:border-b-[#4ebda7] transition-all duration-300 text-zinc-800 cursor-text w-full"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="signup-confirm-password" className="text-sm font-medium text-zinc-600 hover:text-zinc-800 cursor-pointer block">Confirm</Label>
                          <Input
                            id="signup-confirm-password"
                            name="confirmPassword"
                            type="password"
                            required
                            disabled={isLoading}
                            minLength={6}
                            className="h-10 lg:h-11 lg:text-base border-solid border-x-0 border-t-0 border-b-2 border-zinc-500 hover:border-zinc-600 rounded-none bg-transparent px-2 !shadow-none !outline-none !ring-0 focus:!ring-0 focus-visible:!ring-0 focus-visible:!outline-none focus-visible:border-b-[#4ebda7] transition-all duration-300 text-zinc-800 cursor-text w-full"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button type="submit" className="w-full h-10 lg:h-11 rounded-full bg-[#3eb4f0] hover:bg-[#3eb4f0]/90 text-white font-medium text-base shadow-none transition-transform active:scale-[0.98]" disabled={isLoading}>
                          {isLoading ? 'Creating account...' : 'Create Account'}
                        </Button>
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="outline"
                          type="button"
                          className="w-full h-10 lg:h-11 rounded-full border border-zinc-300 text-base font-medium bg-white text-zinc-700 hover:bg-zinc-50 shadow-none transition-transform active:scale-[0.98]"
                          disabled={isLoading}
                          onClick={async () => {
                            setIsLoading(true);
                            await loginWithGoogle();
                            setIsLoading(false);
                          }}
                        >
                          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            <path d="M1 1h22v22H1z" fill="none" />
                          </svg>
                          Sign up with Google
                        </Button>
                      </div>
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
