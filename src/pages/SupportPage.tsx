import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { queryApi } from '@/db/api';
import type { HelpQuery } from '@/types';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, MessageSquare, ClipboardList, Paperclip, CornerDownRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 120, damping: 14 } },
};

const formSchema = z.object({
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
});

type QueryFormValues = z.infer<typeof formSchema>;

export default function SupportPage() {
    const [queries, setQueries] = useState<HelpQuery[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [attachment, setAttachment] = useState<File | null>(null);
    const { toast } = useToast();

    const form = useForm<QueryFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { subject: '', message: '' },
    });

    useEffect(() => { loadQueries(); }, []);

    const loadQueries = async () => {
        try {
            setLoading(true);
            const data = await queryApi.getMyQueries();
            setQueries(data || []);
        } catch (error) {
            console.error('Failed to load queries:', error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: QueryFormValues) => {
        setSubmitting(true);
        try {
            let attachmentUrl: string | undefined = undefined;
            if (attachment) {
                attachmentUrl = await queryApi.uploadQueryAttachment(attachment);
            }
            await queryApi.submitQuery(data, attachmentUrl);
            toast({ title: 'Query Submitted', description: 'We\'ll get back to you soon.' });
            form.reset();
            setAttachment(null);
            loadQueries();
        } catch (error) {
            console.error('Failed to submit query:', error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="font-['Plus_Jakarta_Sans'] pb-12"
        >
            {/* Page Header */}
            <motion.div variants={itemVariants} className="mb-12">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                    Help & <span className="text-blue-600">Support</span>
                </h1>
                <p className="text-lg text-slate-500 font-medium mt-4 max-w-2xl font-['Be_Vietnam_Pro']">
                    Have a question or need assistance? Our team is here to help you navigate your journey.
                </p>
            </motion.div>

            <div className="grid grid-cols-12 gap-8 items-start">

                {/* Left: Raise a Query */}
                <motion.div variants={itemVariants} className="col-span-12 lg:col-span-5">
                    <div className="bg-white rounded-[48px] p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] relative overflow-hidden group">
                        <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:scale-125 transition-transform duration-700" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-10">
                                <span className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 text-white">
                                    <MessageSquare className="w-5 h-5" />
                                </span>
                                <h2 className="text-2xl font-black text-slate-900">Raise a Query</h2>
                            </div>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="subject"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Subject</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="What is this about?"
                                                        className="bg-slate-50 border-none rounded-2xl p-6 h-14 focus-visible:ring-2 focus-visible:ring-blue-600/20 focus-visible:bg-white transition-all font-['Be_Vietnam_Pro'] placeholder:text-slate-300"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-bold text-red-500 ml-1" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="message"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Detailed Message</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Provide details about your query..."
                                                        className="min-h-[160px] bg-slate-50 border-none rounded-[24px] p-6 focus-visible:ring-2 focus-visible:ring-blue-600/20 focus-visible:bg-white transition-all font-['Be_Vietnam_Pro'] resize-none placeholder:text-slate-300"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-bold text-red-500 ml-1" />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-3">
                                        <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Attachment (Optional)</FormLabel>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById('query-attachment')?.click()}
                                            className="bg-slate-50 hover:bg-white border-dashed border-2 border-slate-200 text-slate-500 rounded-2xl h-14 px-6 w-full justify-start gap-3 transition-all group/btn"
                                        >
                                            <Paperclip className="h-5 w-5 text-slate-400 group-hover/btn:text-blue-600 transition-colors" />
                                            <span className="font-bold text-sm truncate max-w-[180px]">
                                                {attachment ? attachment.name : 'Choose file...'}
                                            </span>
                                        </Button>
                                        <input
                                            id="query-attachment"
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-[24px] shadow-xl shadow-blue-200 text-lg font-black tracking-tight transition-all active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
                                        disabled={submitting}
                                    >
                                        {submitting ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Send className="mr-3 h-5 w-5" />}
                                        {submitting ? 'Sending...' : 'Submit My Query'}
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </div>

                    {/* Support Hours */}
                    <div className="mt-8 bg-[#fff8f0] rounded-[40px] p-8 flex items-center gap-6 relative overflow-hidden">
                        <div className="p-4 bg-white rounded-3xl shadow-sm shadow-orange-100 text-orange-600 flex-shrink-0">
                            <Clock className="w-8 h-8" />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-lg font-black text-slate-900">Support Hours</h4>
                            <p className="text-sm text-slate-600 font-['Be_Vietnam_Pro'] font-medium">Mon – Fri • 9:00 AM – 5:00 PM</p>
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <ClipboardList className="w-24 h-24" />
                        </div>
                    </div>
                </motion.div>

                {/* Right: Recent Queries */}
                <motion.div variants={itemVariants} className="col-span-12 lg:col-span-7">
                    <div className="bg-slate-50 rounded-[48px] p-8 md:p-12 min-h-[600px] flex flex-col">
                        <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-3">
                                <span className="p-3 bg-white rounded-2xl shadow-sm text-slate-400">
                                    <ClipboardList className="w-5 h-5" />
                                </span>
                                <h2 className="text-2xl font-black text-slate-900">Recent Queries</h2>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white px-4 py-2 rounded-full shadow-sm">
                                Track Progress
                            </span>
                        </div>

                        <div className="flex-1">
                            {loading ? (
                                <div className="space-y-6">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-40 bg-white/50 animate-pulse rounded-[32px]" />
                                    ))}
                                </div>
                            ) : queries.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20 px-8">
                                    <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mb-6 shadow-sm">
                                        <MessageSquare className="w-10 h-10 text-slate-100" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2">No conversations yet</h3>
                                    <p className="text-slate-400 text-sm max-w-[280px] font-['Be_Vietnam_Pro'] leading-relaxed">
                                        When you raise a query, you'll be able to track the school's response right here.
                                    </p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    <div className="space-y-6">
                                        {queries.map((query) => (
                                            <motion.div
                                                key={query.id}
                                                variants={itemVariants}
                                                layout
                                                className="bg-white rounded-[40px] p-8 shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_24px_48px_rgba(0,0,0,0.06)] transition-all duration-500 group"
                                            >
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="space-y-1">
                                                        <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                                                            {query.subject}
                                                        </h4>
                                                        <p className="text-[10px] font-bold text-slate-300 tracking-wider">
                                                            TICKET #{query.id.split('-')[0].toUpperCase()}
                                                        </p>
                                                    </div>
                                                    <span className={cn(
                                                        "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex-shrink-0",
                                                        query.status === 'open' ? "bg-orange-100 text-orange-600" :
                                                        query.status === 'replied' ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                                                    )}>
                                                        {query.status}
                                                    </span>
                                                </div>

                                                <p className="text-slate-600 text-sm font-['Be_Vietnam_Pro'] font-medium leading-relaxed mb-6 bg-slate-50/50 p-6 rounded-[24px]">
                                                    {query.message}
                                                </p>

                                                {query.admin_reply && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="relative mt-8"
                                                    >
                                                        <div className="absolute top-0 left-6 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                                            <CornerDownRight className="w-4 h-4" />
                                                        </div>
                                                        <div className="bg-[#f0f7ff] rounded-[32px] p-8 pt-10">
                                                            <p className="text-xs font-black text-blue-600 mb-3 uppercase tracking-tighter">School Administrator</p>
                                                            <p className="text-slate-700 text-sm font-['Be_Vietnam_Pro'] font-bold leading-relaxed">{query.admin_reply}</p>
                                                            {query.replied_at && (
                                                                <p className="text-[10px] text-blue-400/70 mt-4 font-bold">
                                                                    Received {format(new Date(query.replied_at), 'MMM d, yyyy')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}

                                                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {format(new Date(query.created_at), 'MMM d • h:mm a')}
                                                    </span>
                                                    {query.attachment_url && (
                                                        <a href={query.attachment_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1.5">
                                                            <Paperclip className="w-3 h-3" /> View Attachment
                                                        </a>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
