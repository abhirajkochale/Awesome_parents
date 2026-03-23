import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { queryApi } from '@/db/api';
import type { HelpQuery } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, MessageSquare, ClipboardList, Paperclip, CornerDownRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { EmptyState } from '@/components/common/EmptyState';
import { motion, AnimatePresence } from 'motion/react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 100,
        },
    },
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
        defaultValues: {
            subject: '',
            message: '',
        },
    });

    useEffect(() => {
        loadQueries();
    }, []);

    const loadQueries = async () => {
        try {
            setLoading(true);
            const data = await queryApi.getMyQueries();
            setQueries(data);
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

            toast({
                title: 'Query Submitted',
                description: 'We have received your message and will get back to you soon.',
            });

            form.reset();
            setAttachment(null);
            loadQueries();
        } catch (error) {
            console.error('Failed to submit query:', error);
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: 'There was an error sending your message. Please try again.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'outline', label: string }> = {
            open: { variant: 'secondary', label: 'Open' },
            replied: { variant: 'default', label: 'Replied' },
            closed: { variant: 'outline', label: 'Closed' },
        };
        const config = variants[status as keyof typeof variants] || { variant: 'outline', label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-6 max-w-5xl mx-auto"
        >
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 italic">Help & Support</h1>
                <p className="text-muted-foreground mt-1 text-base">Have a question? We're here to help.</p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-5">
                {/* Form Section */}
                <motion.div variants={itemVariants} className="md:col-span-2">
                    <Card className="h-full shadow-sm border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Raise a Query
                            </CardTitle>
                            <CardDescription>
                                Describe your issue or question and we'll get back to you.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="subject"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-semibold text-gray-700">Subject</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="What is this about?" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="message"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-semibold text-gray-700">Message</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Provide details about your query..."
                                                        className="min-h-[120px] resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-2">
                                        <FormLabel className="text-sm font-semibold text-gray-700">Attachment (Optional)</FormLabel>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer relative"
                                                onClick={() => document.getElementById('query-attachment')?.click()}
                                            >
                                                <Paperclip className="h-4 w-4 mr-2" />
                                                {attachment ? 'Change File' : 'Attach File'}
                                            </Button>
                                            {attachment && (
                                                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                    {attachment.name}
                                                </span>
                                            )}
                                            <input
                                                id="query-attachment"
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full mt-4 shadow-md" disabled={submitting}>
                                        {submitting ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="mr-2 h-4 w-4" />
                                        )}
                                        Submit Query
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* History Section */}
                <motion.div variants={itemVariants} className="md:col-span-3">
                    <Card className="h-full shadow-sm border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-primary" />
                                Recent Queries
                            </CardTitle>
                            <CardDescription>
                                Your past interactions with the school support.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-20 bg-muted animate-pulse rounded-md" />
                                    ))}
                                </div>
                            ) : queries.length === 0 ? (
                                <EmptyState
                                    icon={MessageSquare}
                                    title="No Queries Yet"
                                    description="You haven't made any support requests. If you have any questions or issues, use the form to reach out to us."
                                />
                            ) : (
                                <motion.div 
                                    variants={containerVariants}
                                    className="space-y-4"
                                >
                                    <AnimatePresence>
                                        {queries.map((query) => (
                                            <motion.div
                                                key={query.id}
                                                variants={itemVariants}
                                                layout
                                                className="flex flex-col border rounded-xl p-5 bg-white border-slate-100 shadow-sm hover:shadow-md transition-all group"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-primary transition-colors">{query.subject}</h4>
                                                    {getStatusBadge(query.status)}
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed mb-4">{query.message}</p>

                                                {query.admin_reply && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="mb-4 pl-4 border-l-4 border-primary/20 bg-primary/5 p-3 rounded-r-lg"
                                                    >
                                                        <p className="text-xs font-bold text-primary mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                                                            <CornerDownRight className="h-4 w-4" /> Response from School
                                                        </p>
                                                        <p className="text-sm text-slate-700 leading-relaxed">{query.admin_reply}</p>
                                                        {query.replied_at && (
                                                            <p className="text-[10px] text-muted-foreground mt-2 inline-block bg-white px-2 py-0.5 rounded border">
                                                                Replied on {format(new Date(query.replied_at), 'MMM d, yyyy')}
                                                            </p>
                                                        )}
                                                    </motion.div>
                                                )}

                                                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-4 border-t border-slate-50 mt-auto">
                                                    <span className="font-mono bg-slate-50 px-2 py-0.5 rounded"># {query.id.split('-')[0].toUpperCase()}</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(query.created_at), 'MMM d, yyyy h:mm a')}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
