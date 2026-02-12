import { Link, useLocation } from 'react-router-dom';
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
    Settings,
    LogOut,
    Menu,
    Users,
    CheckCircle,
    DollarSign,
    Calendar,
    Bell,
    MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { ProfileSettingsDialog } from '@/components/common/ProfileSettingsDialog';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: Settings },
    { path: '/admin/admissions', label: 'Admissions', icon: CheckCircle },
    { path: '/admin/payments', label: 'Payments', icon: DollarSign },
    { path: '/admin/events', label: 'Events', icon: Calendar },
    { path: '/admin/announcements', label: 'Announcements', icon: Bell },
    { path: '/admin/queries', label: 'Queries', icon: MessageSquare },
    { path: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { profile, signOut } = useAuth();
    const location = useLocation();
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) {
            const email = profile?.email;
            return email ? email.substring(0, 1).toUpperCase() : 'A';
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
            {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                            isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                    >
                        <Icon className="h-5 w-5" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="flex min-h-screen w-full bg-background">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 border-r bg-card shrink-0">
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b flex justify-center flex-col items-center">
                        <Link to="/admin" className="flex items-center w-full justify-center">
                            <img src="/AwesomeKids_logo.jpeg" alt="AwesomeKids" className="h-12 w-auto object-contain" />
                        </Link>
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">Admin Portal</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <NavLinks />
                    </div>

                    <div className="p-4 border-t">
                        <div className="flex items-center gap-3 px-3 py-2">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {getInitials(profile?.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {profile?.full_name || profile?.email || 'Admin'}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">Administrator</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-card">
                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-2">
                            <Link to="/admin" className="flex items-center">
                                <img src="/AwesomeKids_logo.jpeg" alt="AwesomeKids" className="h-10 w-auto object-contain" />
                            </Link>
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Admin</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {getInitials(profile?.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium">
                                                {profile?.full_name || profile?.email || 'Admin'}
                                            </p>
                                            <p className="text-xs text-muted-foreground capitalize">Administrator</p>
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
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-64 p-0">
                                    <div className="p-4 border-b flex flex-col items-center justify-center">
                                        <Link to="/admin" className="flex items-center w-full justify-center px-4">
                                            <img src="/AwesomeKids_logo.jpeg" alt="AwesomeKids" className="w-full h-auto object-contain" />
                                        </Link>
                                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">Admin Portal</span>
                                    </div>
                                    <SheetHeader className="sr-only">
                                        <SheetTitle>Navigation Menu</SheetTitle>
                                        <SheetDescription>Mobile navigation links for Admin Portal</SheetDescription>
                                    </SheetHeader>
                                    <div className="py-4">
                                        <NavLinks mobile />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </header>

                {/* Desktop Header */}
                <header className="hidden lg:flex sticky top-0 z-50 w-full border-b bg-card">
                    <div className="flex items-center justify-between w-full px-6 py-4">
                        <div>
                            <h2 className="text-xl font-semibold">
                                {adminNavItems.find((item) => item.path === location.pathname)?.label || 'Admin Portal'}
                            </h2>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {getInitials(profile?.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden md:inline-block">
                                        {profile?.full_name || profile?.email || 'Admin'}
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">
                                            {profile?.full_name || profile?.email || 'Admin'}
                                        </p>
                                        <p className="text-xs text-muted-foreground capitalize">Administrator</p>
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
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-muted/20">
                    <div className="container mx-auto p-4 md:p-6 lg:p-8">{children}</div>
                </main>
            </div>
            <ProfileSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </div>
    );
}
