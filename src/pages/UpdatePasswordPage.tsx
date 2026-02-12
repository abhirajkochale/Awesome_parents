import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';

export default function UpdatePasswordPage() {
    const { updatePassword } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if we have an active session (which should be established from the URL hash)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If there's a hash, we might need to wait for Supabase to process it
                if (window.location.hash && window.location.hash.includes('access_token')) {
                    // Give it a moment, but if it fails, show error
                    // Usually onAuthStateChange handles this, but let's be safe
                    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                        if (event === 'PASSWORD_RECOVERY' || session) {
                            setIsVerifying(false);
                        }
                    });

                    // Fallback timeout
                    setTimeout(() => {
                        supabase.auth.getSession().then(({ data: { session } }) => {
                            if (!session) {
                                setError('Invalid or expired password reset link. Please try again.');
                                setIsVerifying(false);
                            } else {
                                setIsVerifying(false);
                            }
                        });
                    }, 2000);

                    return () => subscription.unsubscribe();
                } else {
                    setError('No password reset link found. Please request a new one.');
                    setIsVerifying(false);
                }
            } else {
                setIsVerifying(false);
            }
        };

        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        const { error } = await updatePassword(password);

        if (error) {
            console.error(error);
            setError(error.message || 'Failed to update password. Please try again.');
        } else {
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        }

        setIsLoading(false);
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardContent className="pt-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Verifying reset link...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Lock className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
                    <CardDescription>
                        Please enter your new password below
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="space-y-4 text-center">
                            <Alert className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Password updated successfully! Redirecting to login...
                                </AlertDescription>
                            </Alert>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {!error && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">New Password</Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            placeholder="Enter new password"
                                            required
                                            disabled={isLoading}
                                            minLength={6}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            placeholder="Confirm new password"
                                            required
                                            disabled={isLoading}
                                            minLength={6}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? 'Updating...' : 'Update Password'}
                                    </Button>
                                </>
                            )}

                            {error && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => navigate('/forgot-password')}
                                >
                                    Request New Link
                                </Button>
                            )}
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
