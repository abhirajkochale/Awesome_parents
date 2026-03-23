import { useState, useEffect } from 'react';
import { queryApi } from '@/db/api';
import type { HelpQuery } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { MessageSquare, Clock, User, Trash2, Reply, Send, Loader2, Sparkles, FileText } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
import { Skeleton } from '@/components/ui/skeleton';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 120, damping: 14 } }
};

export default function AdminQueriesPage() {
    const [queries, setQueries] = useState<HelpQuery[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingQuery, setReplyingQuery] = useState<HelpQuery | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [filter, setFilter] = useState<'all' | 'open' | 'replied' | 'closed'>('all');
    const { toast } = useToast();

    useEffect(() => {
        loadQueries();
    }, []);

    const loadQueries = async () => {
        try {
            setLoading(true);
            const data = await queryApi.getAllQueries();
            // Sort by newest first
            const sorted = [...data].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setQueries(sorted);
        } catch (error) {
            console.error('Failed to load queries:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load queries from server.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await queryApi.deleteQuery(id);
            toast({
                title: 'Query Deleted',
                description: 'The query has been successfully deleted.',
            });
            setQueries(prev => prev.filter(q => q.id !== id));
        } catch (error) {
            console.error('Failed to delete query:', error);
            toast({
                variant: 'destructive',
                title: 'Delete Failed',
                description: 'Failed to delete the query.',
            });
        }
    };

    const handleReplySubmit = async () => {
        if (!replyingQuery || !replyMessage.trim()) return;

        try {
            setIsSubmittingReply(true);
            await queryApi.replyToQuery(replyingQuery.id, replyMessage);
            toast({
                title: 'Reply Sent',
                description: 'Your reply has been sent to the parent.',
            });
            setReplyingQuery(null);
            setReplyMessage('');
            loadQueries();
        } catch (error) {
            console.error('Failed to send reply:', error);
            toast({
                variant: 'destructive',
                title: 'Reply Failed',
                description: 'Failed to send the reply.',
            });
        } finally {
            setIsSubmittingReply(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'open':
                return { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', label: 'Open' };
            case 'replied':
                return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Replied' };
            case 'closed':
                return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400', label: 'Closed' };
            default:
                return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400', label: status };
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 font-['Plus_Jakarta_Sans']">
                <Skeleton className="h-16 w-64 rounded-2xl mb-2" />
                <Skeleton className="h-4 w-48 rounded-md mb-8" />
                <div className="grid lg:grid-cols-2 gap-6">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 w-full rounded-[40px]" />)}
                </div>
            </div>
        );
    }

    const filteredQueries = queries.filter(q => {
        if (filter === 'all') return true;
        return q.status === filter;
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
                        Parent <span className="text-blue-600">Queries</span> 💬
                    </h1>
                    <p className="text-slate-500 font-medium mt-2 text-lg font-['Be_Vietnam_Pro']">
                        View and manage questions and feedback
                    </p>
                </div>
                
                <button
                    onClick={loadQueries}
                    className="bg-white hover:bg-slate-50 text-slate-700 font-bold border-2 border-slate-200 text-sm px-6 py-4 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center self-start"
                >
                    <Loader2 className={cn("h-5 w-5 mr-2 text-blue-500", loading ? "animate-spin" : "")} />
                    Refresh
                </button>
            </motion.div>

            {/* Filters */}
            <motion.div variants={itemVariants} className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100 inline-flex overflow-x-auto hide-scrollbar">
                {[
                    { id: 'all', label: 'All Queries' },
                    { id: 'open', label: 'Open' },
                    { id: 'replied', label: 'Replied' },
                    { id: 'closed', label: 'Closed' },
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

            {/* Queries Grid */}
            {filteredQueries.length === 0 ? (
                <motion.div variants={itemVariants} className="bg-white rounded-[48px] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                    <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <MessageSquare className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">No Queries Found</h3>
                    <p className="text-slate-500 font-medium font-['Be_Vietnam_Pro'] text-lg max-w-sm">
                        There are currently no {filter !== 'all' ? filter : ''} queries to display.
                    </p>
                </motion.div>
            ) : (
                <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredQueries.map((query) => {
                            const style = getStatusStyle(query.status);
                            
                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
                                    transition={{ duration: 0.3 }}
                                    key={query.id} 
                                    className="group relative bg-white rounded-[40px] p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-400 overflow-hidden flex flex-col"
                                >
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-start justify-between gap-4 mb-6">
                                            <div className="max-w-[75%]">
                                                <div className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border mb-4 shadow-sm",
                                                    style.bg, style.text, style.border
                                                )}>
                                                    <span className={cn("w-2 h-2 rounded-full", style.dot, query.status === 'open' && "animate-pulse")} />
                                                    {style.label}
                                                </div>
                                                
                                                <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                                                    "{query.subject}"
                                                </h3>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 rounded-2xl transition-colors shrink-0 shadow-sm" title="Delete Query">
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="bg-white/95 backdrop-blur-xl border-slate-200/50 shadow-2xl rounded-[32px] p-8 font-['Plus_Jakarta_Sans']">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="text-2xl font-black text-slate-900">Delete Query?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-slate-500 font-['Be_Vietnam_Pro'] text-base">
                                                                Are you sure you want to delete this query? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="mt-6">
                                                            <AlertDialogCancel className="px-6 py-4 rounded-2xl font-bold border-slate-200 hover:bg-slate-50">Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(query.id)} className="px-6 py-4 rounded-2xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30">
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                
                                                {query.status !== 'closed' && (
                                                    <button
                                                        onClick={() => {
                                                            setReplyingQuery(query);
                                                            setReplyMessage(query.admin_reply || '');
                                                        }}
                                                        className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-2xl transition-colors shrink-0 shadow-sm"
                                                        title="Reply"
                                                    >
                                                        <Reply className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-y-2 gap-x-6 text-sm font-medium text-slate-500 font-['Be_Vietnam_Pro'] mb-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-100/80 w-fit">
                                            <p className="flex items-center gap-2 text-slate-700 font-bold">
                                                <User className="h-4 w-4 text-slate-400" />
                                                {query.parent?.full_name || 'Unknown Parent'}
                                            </p>
                                            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-300" />
                                            <p className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                {format(new Date(query.created_at), 'MMM d, yyyy h:mm a')}
                                            </p>
                                        </div>

                                        <div className="bg-slate-50/80 rounded-3xl p-6 border border-slate-100/80 mb-6 flex-1">
                                            <p className="text-slate-600 font-medium font-['Be_Vietnam_Pro'] leading-relaxed whitespace-pre-wrap">
                                                {query.message}
                                            </p>
                                            {query.attachment_url && (
                                                <div className="mt-4 pt-4 border-t border-slate-200">
                                                    <a
                                                        href={query.attachment_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors w-fit border border-blue-100 shadow-sm"
                                                    >
                                                        <FileText className="h-4 w-4" /> View Attachment
                                                    </a>
                                                </div>
                                            )}
                                        </div>

                                        {query.admin_reply && (
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-3xl border border-blue-200/60 shadow-inner mt-auto relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                                    <Reply className="h-16 w-16 text-blue-600" />
                                                </div>
                                                <div className="relative z-10">
                                                    <p className="text-xs font-black uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-2">
                                                        <Sparkles className="h-3.5 w-3.5" /> Admin Reply
                                                    </p>
                                                    <p className="text-sm font-medium text-blue-900/80 font-['Be_Vietnam_Pro'] leading-relaxed whitespace-pre-wrap">
                                                        {query.admin_reply}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Reply Dialog */}
            <Dialog open={!!replyingQuery} onOpenChange={(open) => !open && setReplyingQuery(null)}>
                <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-xl border-slate-200/50 shadow-2xl rounded-[40px] p-0 overflow-hidden font-['Plus_Jakarta_Sans']">
                    {replyingQuery && (
                        <div className="p-8 md:p-10">
                            <DialogHeader className="mb-6 space-y-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                                        <Reply className="h-6 w-6" />
                                    </div>
                                    <DialogTitle className="text-2xl font-black text-slate-900">Reply to Parent</DialogTitle>
                                </div>
                                <DialogDescription className="text-slate-500 font-['Be_Vietnam_Pro'] text-base">
                                    Send a response to <span className="font-bold text-slate-700">{replyingQuery.parent?.full_name}</span> regarding "{replyingQuery.subject}".
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                    <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Original Message</p>
                                    <p className="text-sm font-medium text-slate-600 font-['Be_Vietnam_Pro'] italic border-l-2 border-slate-300 pl-3">
                                        "{replyingQuery.message}"
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700 block">Your Response <span className="text-rose-500">*</span></label>
                                    <Textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Type your reply here..."
                                        className="min-h-[160px] resize-none bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-[24px] text-base p-5 font-['Be_Vietnam_Pro']"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-6 lg:pt-8 mt-2 border-t border-slate-100">
                                    <button
                                        onClick={() => setReplyingQuery(null)}
                                        className="px-6 py-4 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors"
                                        disabled={isSubmittingReply}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReplySubmit}
                                        disabled={!replyMessage.trim() || isSubmittingReply}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center min-w-[160px] disabled:opacity-50"
                                    >
                                        {isSubmittingReply ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</>
                                        ) : (
                                            <><Send className="mr-2 h-5 w-5" /> Send Reply</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
