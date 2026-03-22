import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '@/db/api';
import { useAuth } from '@/contexts/AuthContext';
import type { ParentDashboardSummary } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { STANDARD_STYLES } from '@/lib/batchConfig';
import { Baby, Flower2, Palette, BookOpen, GraduationCap, DollarSign, Calendar, Bell, ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { profile } = useAuth();
  const [summary, setSummary] = useState<ParentDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getParentDashboard();
      setSummary(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      submitted: { variant: 'secondary', label: 'Pending Review' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const paymentPercent = summary
    ? Math.round((summary.paidAmount / summary.totalFees) * 100) || 0
    : 0;

  if (loading) {
    return (
      <main className="w-full font-sans">
        <section className="mb-12">
          <Skeleton className="h-16 w-64 bg-[#e7e8e9] rounded-[16px] mb-4" />
          <Skeleton className="h-6 w-48 bg-[#f3f4f5] rounded-full" />
        </section>
        <div className="grid grid-cols-12 gap-8 items-start">
          <Skeleton className="col-span-12 lg:col-span-4 h-64 bg-[#f3f4f5] rounded-[24px]" />
          <Skeleton className="col-span-12 lg:col-span-8 h-64 bg-[#f3f4f5] rounded-[24px]" />
          <Skeleton className="col-span-12 lg:col-span-6 h-48 bg-[#f3f4f5] rounded-[24px]" />
          <Skeleton className="col-span-12 lg:col-span-6 h-48 bg-[#f3f4f5] rounded-[24px]" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full font-sans pt-12">
        <Alert variant="destructive" className="shadow-sm max-w-7xl mx-auto rounded-[24px]">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <div className="flex flex-col w-full bg-[#f8f9fa] font-sans rounded-xl p-2">
      
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-6 lg:gap-8 items-stretch">
        
        {/* Fee Payment Status Card (Column 1-4) */}
        <div className="col-span-12 lg:col-span-4 h-full bg-[#ffffff] p-6 lg:p-8 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex flex-col justify-between hover:scale-[1.01] transition-transform font-['Be_Vietnam_Pro'] relative overflow-hidden">
          <div className="flex items-center justify-between z-10 mb-4">
            <span className="p-3 bg-[#d1e4ff] rounded-full text-[#0061a4]">
              <DollarSign className="w-5 h-5 lg:w-6 lg:h-6" />
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#404752]">Finance</span>
          </div>
          <div className="z-10 mb-6">
            <p className="text-[#404752] font-medium mb-1">Balance Due</p>
            <h3 className="text-3xl lg:text-4xl font-extrabold text-[#191c1d]">₹{summary?.remainingBalance?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</h3>
          </div>
          <div className="space-y-2 z-10 mb-6">
            <div className="flex justify-between text-sm font-bold">
              <span>Payment Progress</span>
              <span className="text-[#0061a4]">{paymentPercent}% Paid</span>
            </div>
            <div className="h-3 w-full bg-[#e7e8e9] rounded-full overflow-hidden">
              <div className="h-full bg-[#2196f3] transition-all duration-1000 ease-out rounded-full" style={{ width: `${paymentPercent}%` }}></div>
            </div>
          </div>
          <div className="pt-4 space-y-3 border-t border-dashed border-[#edeeef] z-10 mb-4">
             <div className="flex justify-between items-center text-sm">
                <span className="text-[#404752]">Base Fee</span>
                <span className="font-semibold text-[#191c1d]">₹{summary?.totalFees?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</span>
             </div>
             {summary && summary.students.some(s => s.admission?.discount_amount && s.admission.discount_amount > 0) && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#b80049] font-medium">Discount</span>
                  <span className="font-bold text-[#b80049]">- ₹{summary.students.reduce((sum, s) => sum + (s.admission?.discount_amount || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
             )}
             <div className="flex justify-between items-center text-sm">
                <span className="text-[#404752]">Total Payable</span>
                <span className="font-semibold text-[#0061a4]">₹{summary?.totalFees?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</span>
             </div>
          </div>
          <Link to="/payments" className="mt-auto text-[#0061a4] font-bold text-sm flex items-center gap-1.5 hover:underline z-10">
            View Payment History <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Your Child Card (Featured) (Column 5-12) */}
        <div className="col-span-12 lg:col-span-8 h-full bg-[#f3f4f5] p-6 lg:p-10 rounded-[24px] relative overflow-hidden flex flex-col md:flex-row gap-6 lg:gap-8 items-center shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          {/* Background Decoration */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#ffd9de]/30 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#ffdcbe]/30 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex-1 w-full z-10 h-full flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#e2165f]/10 text-[#b80049] font-bold text-xs uppercase tracking-widest rounded-full w-fit mb-6">
              <Baby className="h-4 w-4" />
              Featured Child
            </div>
            
            {summary?.students.length === 0 ? (
              <div className="flex flex-col h-full justify-center">
                <h3 className="text-3xl md:text-4xl font-black text-[#191c1d] leading-tight font-['Plus_Jakarta_Sans'] mb-4">No admission submitted</h3>
                <p className="text-lg text-[#404752] leading-relaxed mb-6">It seems you haven't started an application for your little one. Start their journey with us today!</p>
                <Button asChild className="px-8 py-6 bg-[#b80049] hover:bg-[#900038] text-white font-bold text-lg rounded-full shadow-[0_8px_32px_rgba(184,0,73,0.3)] hover:scale-[1.05] transition-all flex items-center gap-3 w-fit">
                  <Link to="/admission">
                    Apply Now <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col h-full justify-center">
                 {/* Show exactly ONE child to match Stitch plan and avoid scrolling entirely */}
                 {summary?.students.slice(0, 1).map((student) => {
                   const stdValue = (student.class || '').toLowerCase();
                   const styles = STANDARD_STYLES[stdValue];
                   const iconMap: Record<string, any> = { Baby, Flower2, Palette, BookOpen, GraduationCap };
                   const IconComponent = iconMap[styles?.icon || 'GraduationCap'] || GraduationCap;
                   return (
                     <div key={student.id} className="flex flex-col justify-center gap-4">
                        <h3 className="text-3xl md:text-4xl font-black text-[#191c1d] leading-tight font-['Plus_Jakarta_Sans']">{student.full_name}</h3>
                        <p className="text-lg text-[#404752] mb-4">{student.class} • {student.academic_year}</p>
                        
                        <div className="flex flex-wrap items-center gap-4">
                          <div className={cn("p-4 rounded-[16px] text-white", styles?.gradient || "bg-[#0061a4]")}>
                            <IconComponent className="h-8 w-8" />
                          </div>
                          {student.admission && (
                            <div className="flex items-center gap-4 ml-2">
                              {getStatusBadge(student.admission.status)}
                              <Button asChild variant="link" size="sm" className="text-[#0061a4] hover:text-[#00497d] p-0 font-bold text-base">
                                <Link to="/admission">View Admission Forms <ArrowRight className="w-4 h-4 ml-2"/></Link>
                              </Button>
                            </div>
                          )}
                        </div>
                     </div>
                   );
                 })}
                 
                 {/* If multiple children exist, gracefully provide a link */}
                 {summary && summary.students.length > 1 && (
                    <div className="mt-6 pt-4 border-t border-dashed border-[#d9dadb]">
                      <Link to="/admission" className="text-sm font-bold text-[#404752] hover:text-[#0061a4] transition-colors">
                        + {summary.students.length - 1} other child application{summary.students.length - 1 > 1 ? 's' : ''} available 
                      </Link>
                    </div>
                 )}
              </div>
            )}
          </div>

          <div className="hidden lg:flex w-1/3 justify-center z-10 shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-[#ffd9de] opacity-50 rounded-[24px] rotate-6"></div>
              <div className="relative bg-[#ffffff] p-8 rounded-[24px] shadow-xl transform -rotate-3 hover:rotate-0 transition-transform flex flex-col items-center justify-center">
                <Baby className="text-[#b80049] h-20 w-20" />
                <div className="mt-6 space-y-3 flex flex-col items-center">
                  <div className="h-2 w-24 bg-[#edeeef] rounded-full"></div>
                  <div className="h-2 w-16 bg-[#edeeef] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Event Card (Column 1-6) */}
        <div className="col-span-12 lg:col-span-6 h-full bg-[#ffffff] p-6 lg:p-8 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex items-center gap-6 lg:gap-8 hover:scale-[1.01] transition-transform overflow-hidden">
          <div className="w-20 h-20 lg:w-24 lg:h-24 flex-shrink-0 bg-[#ffdcbe] rounded-[24px] flex flex-col items-center justify-center text-[#8b5000]">
            <Calendar className="h-6 w-6 lg:h-8 lg:w-8 mb-1 lg:mb-2" />
            <span className="text-[10px] lg:text-xs font-bold uppercase tracking-tighter">Events</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-lg lg:text-xl font-bold text-[#191c1d] mb-1 lg:mb-2 font-['Plus_Jakarta_Sans']">Next Event</h4>
            {summary?.upcomingEvents.length === 0 ? (
               <p className="text-sm lg:text-base text-[#404752]">No upcoming events scheduled at the moment.</p>
            ) : (
               <>
                 <p className="font-semibold text-[#191c1d] text-base lg:text-lg truncate">{summary?.upcomingEvents[0]?.title}</p>
                 <p className="text-[#404752] text-sm mt-1">{summary?.upcomingEvents[0]?.event_date ? format(new Date(summary.upcomingEvents[0].event_date), 'MMMM d, yyyy') : ''}</p>
               </>
            )}
          </div>
          <Button asChild className="p-3 lg:p-4 h-auto aspect-square bg-[#e7e8e9] rounded-full text-[#404752] hover:bg-[#8b5000] hover:text-white transition-all shadow-none flex-shrink-0">
            <Link to="/events">
              <ArrowRight className="h-5 w-5 lg:h-6 lg:w-6" />
            </Link>
          </Button>
        </div>

        {/* Announcements Card (Column 7-12) */}
        <div className="col-span-12 lg:col-span-6 h-full bg-[#ffffff] p-6 lg:p-8 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden">
          <div className="flex justify-between items-center shrink-0 mb-4 lg:mb-6">
            <h4 className="text-lg lg:text-xl font-bold text-[#191c1d] font-['Plus_Jakarta_Sans']">Recent Announcements</h4>
            <Link to="/announcements" className="text-[10px] lg:text-xs font-bold text-[#0061a4] uppercase tracking-widest hover:underline px-3 py-1 bg-[#d1e4ff] rounded-full shrink-0">See All</Link>
          </div>
          <div className="flex flex-col gap-3 lg:gap-4 overflow-hidden justify-center h-full">
            {(!summary?.recentAnnouncements || summary.recentAnnouncements.length === 0) ? (
               <div className="text-[#404752] text-sm lg:text-base text-center italic">No recent announcements.</div>
            ) : (
               // Strictly limit to 2 announcements to prevent ANY scrolling
               summary.recentAnnouncements.slice(0, 2).map((announcement) => {
                 const isHigh = announcement.priority === 'high';
                 return (
                  <Link to="/announcements" key={announcement.id} className="block shrink-0 transition-transform hover:scale-[1.01]">
                    <div className={cn("flex items-start gap-4 p-3 lg:p-4 rounded-[16px] border border-transparent transition-colors", isHigh ? "bg-red-50 hover:bg-red-100/50 hover:border-red-200" : "bg-[#f3f4f5] hover:bg-[#e7e8e9] hover:border-[#d9dadb]")}>
                      <div className={cn("p-2 lg:p-2.5 rounded-full shrink-0", isHigh ? "bg-red-100 text-red-600" : "bg-[#d1e4ff] text-[#0061a4]")}>
                        {isHigh ? <AlertCircle className="h-4 w-4 lg:h-5 lg:w-5" /> : <Bell className="h-4 w-4 lg:h-5 lg:w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm lg:text-base font-bold mb-1 leading-tight truncate", isHigh ? "text-red-900" : "text-[#191c1d]")}>{announcement.title}</p>
                        <p className={cn("text-[10px] lg:text-[11px] uppercase font-bold tracking-widest", isHigh ? "text-red-700/80" : "text-[#404752]")}>
                          {format(new Date(announcement.announcement_date), 'MMM d, yyyy')} • {isHigh && 'URGENT MESSAGE'}
                        </p>
                      </div>
                    </div>
                  </Link>
                 )
               })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

