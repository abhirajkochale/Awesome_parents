import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Home,
    FileText,
    CreditCard,
    Calendar,
    Bell,
    LogOut,
    Settings,
    MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { ProfileSettingsDialog } from '@/components/common/ProfileSettingsDialog';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { BrandLoader } from '@/components/common/BrandLoader';
import { NotificationBell } from '@/components/common/NotificationBell';
import { PlayfulBackground } from '@/components/common/PlayfulBackground';

interface ParentLayoutProps {
    children: React.ReactNode;
}

const parentNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/admission', label: 'Admission', icon: FileText },
    { path: '/payments', label: 'Fees & Payments', icon: CreditCard },
    { path: '/events', label: 'School Events', icon: Calendar },
    { path: '/announcements', label: 'Announcements', icon: Bell },
    { path: '/support', label: 'Help & Support', icon: MessageSquare },
];

export default function ParentLayout({ children }: ParentLayoutProps) {
    const { profile, signOut, loading } = useAuth();
    const location = useLocation();
    const [settingsOpen, setSettingsOpen] = useState(false);

    if (loading) {
        return <BrandLoader fullScreen text="Loading Parent Portal..." />;
    }

    if (!profile) {
        return <Navigate to="/login" replace />;
    }

    const handleSignOut = async () => {
        await signOut();
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) {
            const email = profile?.email;
            return email ? email.substring(0, 1).toUpperCase() : 'P';
        }
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
        <nav className={cn('space-y-1', mobile ? 'px-4' : '')}>
            {parentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                    >
                        <Icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-400")} />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );

    const MobileBottomNav = () => (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t pb-safe">
            <div className="flex items-center justify-around p-2">
                {parentNavItems.slice(0, 5).map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                'flex flex-col items-center justify-center w-full py-1 min-w-[64px]',
                                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Icon className="h-6 w-6 mb-1" strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium truncate w-full text-center">
                                {item.label.split(' ')[0]} {/* Keep it extremely short */}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );

    return (
        <div className="flex min-h-screen w-full bg-background pb-16 lg:pb-0 relative overflow-hidden">
            <PlayfulBackground />
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 border-r bg-sidebar shrink-0 relative z-20">
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b flex justify-center">
                        <Link to="/" className="flex items-center w-full">
                            <img src="/AwesomeKids_logo.jpeg" alt="AwesomeKids" className="w-full h-auto object-contain hover:opacity-90 transition-opacity dark:invert-[0.05] dark:brightness-90" />
                        </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <NavLinks />
                    </div>

                    <div className="p-4 border-t bg-muted/30">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {getInitials(profile?.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate text-foreground">
                                    {profile?.full_name || profile?.email || 'Parent'}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">Parent Portal</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="lg:hidden sticky top-0 z-50 w-full glass">
                    <div className="flex items-center justify-between p-4">
                        <Link to="/" className="flex items-center">
                            <img src="/AwesomeKids_logo.jpeg" alt="AwesomeKids" className="h-10 w-auto object-contain" />
                        </Link>

                        <div className="flex items-center gap-2">
                            <NotificationBell />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-blue-100 text-blue-700">
                                                {getInitials(profile?.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium">
                                                {profile?.full_name || profile?.email || 'Parent'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Parent Portal</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Profile Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleSignOut}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Desktop Header */}
                <header className="hidden lg:flex sticky top-0 z-50 w-full glass">
                    <div className="flex items-center justify-between w-full px-8 py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                {parentNavItems.find((item) => item.path === location.pathname)?.label || 'Welcome'}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <NotificationBell />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-blue-100 text-blue-700">
                                                {getInitials(profile?.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="hidden md:inline-block">
                                            {profile?.full_name || profile?.email || 'Parent'}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium">
                                                {profile?.full_name || profile?.email || 'Parent'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Parent Portal</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                                        <Settings className="mr-2 h-4 w-4" />
                                        Profile Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleSignOut}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="container mx-auto p-4 md:p-8 max-w-7xl">{children}</div>
                </main>
            </div>
            <MobileBottomNav />
            <ProfileSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
