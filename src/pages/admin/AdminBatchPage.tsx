import { useEffect, useState } from 'react';
import { batchApi } from '@/db/api';
import type { Student, Profile, Admission } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { STANDARDS, getBatchesForStandard, STANDARD_LABELS, STANDARD_STYLES } from '@/lib/batchConfig';
import type { BatchOption } from '@/lib/batchConfig';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Users, Clock, AlertCircle, Phone, Baby, Flower2, Palette, BookOpen, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

type StudentWithBatch = Student & { parent?: Profile; admission?: Admission };

export default function AdminBatchPage() {
  const [students, setStudents] = useState<StudentWithBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await batchApi.getStudentsByBatch();
      setStudents(data as StudentWithBatch[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Separate unassigned students (approved but no batch)
  const unassigned = students.filter((s) => !s.batch_id);

  // Group assigned students by standard → batch
  const getStudentsForBatch = (batchId: string) =>
    students.filter((s) => s.batch_id === batchId);

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="h-10 w-64 bg-muted" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-bold">Batch Management</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          View students organized by standard and batch timing
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Approved</span>
            </div>
            <p className="text-2xl font-bold mt-1">{students.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Assigned</span>
            </div>
            <p className="text-2xl font-bold mt-1">{students.length - unassigned.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Unassigned</span>
            </div>
            <p className="text-2xl font-bold mt-1">{unassigned.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Standards</span>
            </div>
            <p className="text-2xl font-bold mt-1">{STANDARDS.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned students */}
      {unassigned.length > 0 && (
        <Card className="border-amber-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Unassigned Students ({unassigned.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unassigned.map((student) => (
                <StudentRow key={student.id} student={student} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Standards with batches */}
      <Accordion type="multiple" defaultValue={STANDARDS.map(s => s)} className="space-y-3">
        {STANDARDS.map((standard) => {
          const batches = getBatchesForStandard(standard);
          const totalStudentsInStandard = batches.reduce(
            (acc, b) => acc + getStudentsForBatch(b.batchId).length,
            0
          );
          const styles = STANDARD_STYLES[standard];
          const iconMap: Record<string, any> = { Baby, Flower2, Palette, BookOpen, GraduationCap };
          const IconComponent = iconMap[styles?.icon || 'GraduationCap'] || GraduationCap;

          return (
            <AccordionItem key={standard} value={standard} className={cn("border-2 rounded-xl px-4 shadow-sm overflow-hidden", styles?.borderColor || "border-muted")}>
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-left">
                  <div className={cn("p-1.5 rounded-lg", styles?.accent || "bg-primary")}>
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className={cn("font-bold text-base leading-none", styles?.color || "text-foreground")}>
                      {STANDARD_LABELS[standard] || standard}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {totalStudentsInStandard} student{totalStudentsInStandard !== 1 ? 's' : ''} across {batches.length} batches
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-4">
                  {batches.map((batch) => {
                    const batchStudents = getStudentsForBatch(batch.batchId);
                    return (
                      <BatchSection
                        key={batch.batchId}
                        batch={batch}
                        students={batchStudents}
                      />
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

function BatchSection({
  batch,
  students,
}: {
  batch: BatchOption;
  students: StudentWithBatch[];
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{batch.batchTime}</span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {students.length} student{students.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      {students.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          No students assigned to this batch
        </div>
      ) : (
        <div className="divide-y">
          {students.map((student) => (
            <StudentRow key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  );
}

function StudentRow({ student }: { student: StudentWithBatch }) {
  const parentPhone = student.parent?.phone || student.mother_phone || student.father_phone || '-';
  return (
    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{student.full_name}</p>
        <p className="text-xs text-muted-foreground truncate">
          Parent: {student.parent?.full_name || '-'}
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
        <span className="flex items-center gap-1">
          <Phone className="h-3 w-3" />
          {parentPhone}
        </span>
        {student.batch_time && (
          <Badge variant="outline" className="text-xs font-normal">
            {student.batch_time}
          </Badge>
        )}
        <Badge
          variant={student.admission?.status === 'approved' ? 'default' : 'secondary'}
          className="text-xs"
        >
          {student.admission?.status || 'unknown'}
        </Badge>
      </div>
    </div>
  );
}
