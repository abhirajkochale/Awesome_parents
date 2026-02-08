import { useState, useEffect } from 'react';
import { queryApi } from '@/db/api';
import type { HelpQuery } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { MessageSquare, Clock, User } from 'lucide-react';

export default function AdminQueriesPage() {
    const [queries, setQueries] = useState<HelpQuery[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadQueries();
    }, []);

    const loadQueries = async () => {
        try {
            setLoading(true);
            const data = await queryApi.getAllQueries();
            setQueries(data);
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

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive', label: string }> = {
            open: { variant: 'destructive', label: 'Open' },
            replied: { variant: 'default', label: 'Replied' },
            closed: { variant: 'outline', label: 'Closed' },
        };
        const config = variants[status as keyof typeof variants] || { variant: 'outline', label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Parent Queries</h1>
                    <p className="text-muted-foreground mt-1 text-base">View and manage questions from parents.</p>
                </div>
                <Button onClick={loadQueries} variant="outline" size="sm">
                    Refresh List
                </Button>
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading queries...</div>
                    ) : queries.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No queries found.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {queries.map((query) => (
                                <div key={query.id} className="p-6 hover:bg-muted/30 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-3">
                                            <div className="bg-primary/10 p-2 rounded-full hidden sm:block">
                                                <MessageSquare className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 italic">{query.subject}</h3>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {query.parent?.full_name || 'Unknown Parent'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(query.created_at), 'MMM d, yyyy h:mm a')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {getStatusBadge(query.status)}
                                    </div>
                                    <div className="bg-white border rounded-lg p-4 ml-0 sm:ml-11">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{query.message}</p>
                                        {query.attachment_url && (
                                            <div className="mt-3 pt-3 border-t">
                                                <a
                                                    href={query.attachment_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                                                >
                                                    View Attachment
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
