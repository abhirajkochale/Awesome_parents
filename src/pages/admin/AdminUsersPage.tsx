import { useEffect, useState } from 'react';
import { profileApi } from '@/db/api';
import type { Profile, UserRole } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, User, Trash2, Mail, Phone, Calendar, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 120, damping: 14 } }
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'admin' | 'teacher' | 'parent'>('all');
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getAllProfiles();
      // Sort by latest joined
      const sorted = [...data].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });
      setUsers(sorted);
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load users from server.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await profileApi.updateUserRole(userId, newRole);
      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
      loadUsers();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await profileApi.deleteProfile(userId);
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: Shield };
      case 'teacher':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: Sparkles };
      case 'parent':
        return { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', icon: User };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', icon: User };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 font-['Plus_Jakarta_Sans']">
        <Skeleton className="h-16 w-64 rounded-2xl mb-2" />
        <Skeleton className="h-4 w-48 rounded-md mb-8" />
        <div className="space-y-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-[24px]" />)}
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    if (filter === 'all') return true;
    return u.role === filter;
  });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="font-['Plus_Jakarta_Sans'] pb-12 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Manage <span className="text-blue-600">Users</span> 👥
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-lg font-['Be_Vietnam_Pro']">
            View, filter, and modify user roles and access
          </p>
        </div>
        
        <button
          onClick={loadUsers}
          className="bg-white hover:bg-slate-50 text-slate-700 font-bold border-2 border-slate-200 text-sm px-6 py-4 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center self-start"
        >
          <Loader2 className={cn("h-5 w-5 mr-2 text-blue-500", loading ? "animate-spin" : "")} />
          Refresh
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100 inline-flex overflow-x-auto hide-scrollbar">
        {[
          { id: 'all', label: 'All Users' },
          { id: 'admin', label: 'Admins' },
          { id: 'teacher', label: 'Teachers' },
          { id: 'parent', label: 'Parents' },
        ].map((f) => {
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={cn(
                "min-w-[120px] px-6 py-4 rounded-2xl text-sm font-bold transition-all whitespace-nowrap",
                isActive 
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </motion.div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <motion.div variants={itemVariants} className="bg-white rounded-[48px] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
          <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <User className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">No Users Found</h3>
          <p className="text-slate-500 font-medium font-['Be_Vietnam_Pro'] text-lg max-w-sm">
            There are currently no {filter !== 'all' ? filter : ''} users in the system.
          </p>
        </motion.div>
      ) : (
        <div className="bg-white rounded-[40px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              Directory <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">{filteredUsers.length}</span>
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            <AnimatePresence mode="popLayout">
              {filteredUsers.map((user) => {
                const isCurrentUser = user.id === currentUser?.id;
                const roleStyle = getRoleStyle(user.role);
                const RoleIcon = roleStyle.icon;

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    key={user.id} 
                    className={cn(
                      "p-6 md:p-8 hover:bg-slate-50/80 transition-colors flex flex-col xl:flex-row xl:items-center justify-between gap-6",
                      isCurrentUser && "bg-blue-50/30 hover:bg-blue-50/50"
                    )}
                  >
                    <div className="flex items-start gap-5">
                      {/* Avatar/Icon */}
                      <div className={cn(
                        "h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center shadow-inner border",
                        roleStyle.bg, roleStyle.text, roleStyle.border
                      )}>
                        <RoleIcon className="h-6 w-6" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg md:text-xl font-black text-slate-900">
                            {user.full_name || 'Anonymous User'}
                          </h3>
                          {isCurrentUser && (
                            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white rounded-lg">
                              You
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm font-medium text-slate-500 font-['Be_Vietnam_Pro'] mt-2">
                          <p className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            {user.email || 'No email provided'}
                          </p>
                          {user.phone && (
                            <p className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-slate-400" />
                              {user.phone}
                            </p>
                          )}
                          <p className="flex items-center gap-2 text-slate-400">
                            <Calendar className="h-4 w-4" />
                            Joined {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'Recently'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 xl:w-auto pt-4 xl:pt-0 border-t xl:border-t-0 border-slate-100 shrink-0">
                      <Select
                        value={user.role}
                        onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                        disabled={isCurrentUser}
                      >
                        <SelectTrigger className="w-[140px] h-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-700 hover:bg-slate-100 focus:ring-blue-500 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200 shadow-xl font-['Plus_Jakarta_Sans'] font-medium">
                          <SelectItem value="parent" className="py-3 cursor-pointer">Parent</SelectItem>
                          <SelectItem value="teacher" className="py-3 cursor-pointer">Teacher</SelectItem>
                          <SelectItem value="admin" className="py-3 cursor-pointer">Admin</SelectItem>
                        </SelectContent>
                      </Select>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            disabled={isCurrentUser}
                            title={isCurrentUser ? "Cannot delete yourself" : "Delete User"}
                            className="h-12 w-12 flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-rose-100 shrink-0"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white/95 backdrop-blur-xl border-slate-200/50 shadow-2xl rounded-[32px] p-8 font-['Plus_Jakarta_Sans']">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                              <AlertCircle className="h-6 w-6 text-rose-500" />
                              Delete User Account?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-['Be_Vietnam_Pro'] text-base mt-4 space-y-4">
                              <p>Are you sure you want to permanently delete the account for <strong className="text-slate-700">"{user.full_name || user.email}"</strong>?</p>
                              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-rose-800 text-sm">
                                This action cannot be undone. All data associated with this user will be permanently removed from the system.
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-8">
                            <AlertDialogCancel className="px-6 py-4 rounded-2xl font-bold border-slate-200 hover:bg-slate-50">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-6 py-4 rounded-2xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30"
                            >
                              Delete User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}
