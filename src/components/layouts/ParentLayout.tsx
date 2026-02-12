import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
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
    Menu,
    Settings,
    MessageSquare,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { ProfileSettingsDialog } from '@/components/common/ProfileSettingsDialog';

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
        return (
            <div className="flex bg-slate-50 min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
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
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                    >
                        <Icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-400")} />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="flex min-h-screen w-full bg-slate-50/50">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 border-r bg-white shrink-0">
                <div className="flex flex-col h-full">
                    <div className="p-6 border-b flex justify-center">
                        <Link to="/" className="flex items-center w-full">
                            <img src="/AwesomeKids_logo.jpeg" alt="AwesomeKids" className="w-full h-auto object-contain hover:opacity-90 transition-opacity" />
                        </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <NavLinks />
                    </div>

                    <div className="p-4 border-t bg-slate-50">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                                    {getInitials(profile?.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate text-gray-900">
                                    {profile?.full_name || profile?.email || 'Parent'}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">Parent Portal</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                    <div className="flex items-center justify-between p-4">
                        <Link to="/" className="flex items-center">
                            <img src="/AwesomeKids_logo.jpeg" alt="AwesomeKids" className="h-10 w-auto object-contain" />
                        </Link>

                        <div className="flex items-center gap-2">
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

                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Menu className="h-6 w-6" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-72 p-0">
                                    <div className="p-6 border-b flex justify-center bg-slate-50">
                                        <Link to="/" className="flex items-center w-full justify-center">
                                            <img src="/AwesomeKids_logo.jpeg" alt="AwesomeKids" className="w-full h-auto object-contain" />
                                        </Link>
                                    </div>
                                    <SheetHeader className="sr-only">
                                        <SheetTitle>Navigation Menu</SheetTitle>
                                        <SheetDescription>Mobile navigation links for Parent Portal</SheetDescription>
                                    </SheetHeader>
                                    <div className="py-6">
                                        <NavLinks mobile />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </header>

                {/* Desktop Header */}
                <header className="hidden lg:flex sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                    <div className="flex items-center justify-between w-full px-8 py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {parentNavItems.find((item) => item.path === location.pathname)?.label || 'Welcome'}
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
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
            <ProfileSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
