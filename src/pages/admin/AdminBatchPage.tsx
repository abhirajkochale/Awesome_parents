import { useState, useEffect } from 'react';
import { batchApi } from '@/db/api';
import type { Student, Profile, Admission } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getBatchesForStandard, STANDARDS, STANDARD_LABELS, STANDARD_STYLES } from '@/lib/batchConfig';
import { Clock, Users, Loader2, Phone, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

type StudentWithBatchDetails = Student & { parent?: Profile; admission?: Admission };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 120, damping: 14 } }
};

export default function AdminBatchPage() {
  const [batches, setBatches] = useState<StudentWithBatchDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStandard, setActiveStandard] = useState<string>(STANDARDS[0]);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await batchApi.getStudentsByBatch();
      setBatches(data);
    } catch (error) {
      console.error('Failed to load batches:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load batch data.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBatches();
    setRefreshing(false);
  };

  const getStudentsForBatch = (standard: string, batchId: string) => {
    return batches.filter(
      (student) => student.class === standard && student.batch_id === batchId
    );
  };

  if (loading && !refreshing) {
    return (
      <div className="space-y-6 font-['Plus_Jakarta_Sans'] max-w-7xl mx-auto">
        <Skeleton className="h-16 w-72 rounded-2xl mb-2" />
        <Skeleton className="h-6 w-full max-w-2xl rounded-2xl mb-8" />
        <div className="flex gap-4 overflow-x-auto pb-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-40 rounded-2xl shrink-0" />)}
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
          <Skeleton className="h-80 w-full rounded-[40px]" />
          <Skeleton className="h-80 w-full rounded-[40px]" />
        </div>
      </div>
    );
  }

  const standardBatches = getBatchesForStandard(activeStandard);
  const activeStyle = STANDARD_STYLES[activeStandard] || { bgColor: 'bg-blue-100', color: 'text-blue-700', borderColor: 'border-blue-200' };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="font-['Plus_Jakarta_Sans'] pb-12 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Batch <span className="text-blue-600">Management</span> ⏰
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-lg font-['Be_Vietnam_Pro']">
            Organize and view student class timings
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-white hover:bg-slate-50 text-slate-700 font-bold border-2 border-slate-200 text-sm px-6 py-4 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center self-start"
        >
          <Loader2 className={cn("h-5 w-5 mr-2 text-blue-500", refreshing ? "animate-spin" : "")} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </motion.div>

      {/* Standard Selector Navigation */}
      <motion.div variants={itemVariants} className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100 flex overflow-x-auto hide-scrollbar">
        {STANDARDS.map((std) => {
          const isActive = std === activeStandard;
          const style = STANDARD_STYLES[std] || { bgColor: 'bg-slate-100', color: 'text-slate-700' };
          
          return (
            <button
              key={std}
              onClick={() => setActiveStandard(std)}
              className={cn(
                "min-w-[140px] px-6 py-4 rounded-2xl text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2",
                isActive 
                  ? "bg-slate-900 text-white shadow-lg"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", style.bgColor)} />
              {STANDARD_LABELS[std]}
            </button>
          );
        })}
      </motion.div>

      {/* Batches Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-8">
        <AnimatePresence mode="popLayout">
          {standardBatches.map((batchOption) => {
            const batchStudents = getStudentsForBatch(activeStandard, batchOption.batchId);
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                key={batchOption.batchId}
                className="bg-white rounded-[40px] p-6 lg:p-8 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] border border-slate-100 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full"
              >
                {/* Batch Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className={cn(
                    "flex items-center justify-center h-16 w-16 rounded-[20px] shadow-inner shrink-0",
                    activeStyle.bgColor, activeStyle.color
                  )}>
                    <Clock className="h-8 w-8" />
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      {batchOption.batchTime}
                    </h3>
                    <div className="flex items-center justify-end gap-1.5 mt-1 text-slate-500 font-bold text-sm">
                      <Users className="h-4 w-4" />
                      {batchStudents.length} Students
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-slate-50/80 rounded-3xl p-4 border border-slate-100 overflow-y-auto max-h-[320px] hide-scrollbar scroll-smooth">
                  {batchStudents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                      <Users className="h-12 w-12 text-slate-300 mb-3" />
                      <p className="text-sm font-bold text-slate-500">No students assigned to this batch yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {batchStudents.map((student) => {
                        const parentPhone = student.parent?.phone || student.mother_phone || student.father_phone || 'No Phone';
                        
                        return (
                          <div key={student.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2 relative group overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/0 group-hover:bg-blue-500 transition-colors" />
                            
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-slate-800 text-sm pr-4 line-clamp-1">{student.full_name}</h4>
                              {student.admission?.status === 'approved' ? (
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-none text-[10px] px-2 py-0.5 rounded-lg">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-lg shadow-none">Pending</Badge>
                              )}
                            </div>
                            
                            <div className="space-y-1.5 mt-1">
                              <p className="text-xs font-medium text-slate-500 flex items-center gap-2 font-['Be_Vietnam_Pro']">
                                <User className="h-3.5 w-3.5 text-slate-400" /> 
                                {student.parent?.full_name || 'Guardian'}
                              </p>
                              <p className="text-xs font-medium text-slate-500 flex items-center gap-2 font-['Be_Vietnam_Pro']">
                                <Phone className="h-3.5 w-3.5 text-slate-400" /> 
                                {parentPhone}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
