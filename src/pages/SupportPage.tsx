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
import { Loader2, Send, MessageSquare, ClipboardList, Paperclip, CornerDownRight } from 'lucide-react';
import { format } from 'date-fns';

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
            let attachmentUrl = undefined;
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
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 italic">Help & Support</h1>
                <p className="text-muted-foreground mt-1 text-base">Have a question? We're here to help.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-5">
                {/* Form Section */}
                <Card className="md:col-span-2 shadow-sm border-gray-200">
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

                {/* History Section */}
                <Card className="md:col-span-3 shadow-sm border-gray-200">
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
                            <div className="text-center py-12 text-muted-foreground">
                                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No queries found.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {queries.map((query) => (
                                    <div
                                        key={query.id}
                                        className="flex flex-col border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-gray-900">{query.subject}</h4>
                                            {getStatusBadge(query.status)}
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{query.message}</p>

                                        {query.admin_reply && (
                                            <div className="mb-3 pl-3 border-l-2 border-primary/30 bg-primary/5 p-2 rounded-r-md">
                                                <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                                                    <CornerDownRight className="h-3 w-3" /> Response from School
                                                </p>
                                                <p className="text-sm text-gray-700">{query.admin_reply}</p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t">
                                            <span>Ref: {query.id.split('-')[0].toUpperCase()}</span>
                                            <span>{format(new Date(query.created_at), 'MMM d, yyyy h:mm a')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
