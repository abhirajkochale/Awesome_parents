export interface BatchOption {
  batchId: string;
  standard: string;
  batchTime: string;
  batchLabel: string;
}

export const STANDARDS = ['playgroup', 'nursery', 'lkg', 'ukg'] as const;

export const STANDARD_LABELS: Record<string, string> = {
  playgroup: 'Playgroup',
  nursery: 'Nursery',
  lkg: 'L.K.G.',
  ukg: 'U.K.G.',
};

export interface StandardStyle {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  gradient: string;
  accent: string;
}

export const STANDARD_STYLES: Record<string, StandardStyle> = {
  playgroup: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    accent: 'bg-amber-500',
    icon: 'Baby',
    gradient: 'from-amber-400 to-orange-500'
  },
  nursery: {
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    accent: 'bg-pink-500',
    icon: 'Flower2',
    gradient: 'from-pink-400 to-rose-500'
  },
  lkg: {
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    accent: 'bg-sky-500',
    icon: 'Palette',
    gradient: 'from-sky-400 to-indigo-500'
  },
  ukg: {
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    accent: 'bg-emerald-500',
    icon: 'BookOpen',
    gradient: 'from-emerald-400 to-teal-500'
  },
};

export const BATCH_CONFIG: BatchOption[] = [
  // Playgroup
  { batchId: 'playgroup_9_11', standard: 'playgroup', batchTime: '9:00 AM – 11:00 AM', batchLabel: 'Playgroup Morning' },
  { batchId: 'playgroup_11_1', standard: 'playgroup', batchTime: '11:00 AM – 1:00 PM', batchLabel: 'Playgroup Midday' },

  // Nursery
  { batchId: 'nursery_9_12', standard: 'nursery', batchTime: '9:00 AM – 12:00 PM', batchLabel: 'Nursery Morning' },
  { batchId: 'nursery_12_3', standard: 'nursery', batchTime: '12:00 PM – 3:00 PM', batchLabel: 'Nursery Afternoon' },
  { batchId: 'nursery_3_6', standard: 'nursery', batchTime: '3:00 PM – 6:00 PM', batchLabel: 'Nursery Evening' },

  // LKG
  { batchId: 'lkg_9_12', standard: 'lkg', batchTime: '9:00 AM – 12:00 PM', batchLabel: 'LKG Morning' },
  { batchId: 'lkg_12_3', standard: 'lkg', batchTime: '12:00 PM – 3:00 PM', batchLabel: 'LKG Afternoon' },
  { batchId: 'lkg_3_6', standard: 'lkg', batchTime: '3:00 PM – 6:00 PM', batchLabel: 'LKG Evening' },

  // UKG
  { batchId: 'ukg_9_12', standard: 'ukg', batchTime: '9:00 AM – 12:00 PM', batchLabel: 'UKG Morning' },
  { batchId: 'ukg_12_3', standard: 'ukg', batchTime: '12:00 PM – 3:00 PM', batchLabel: 'UKG Afternoon' },
  { batchId: 'ukg_3_6', standard: 'ukg', batchTime: '3:00 PM – 6:00 PM', batchLabel: 'UKG Evening' },
];

/**
 * Returns batch options for a given student standard/class.
 * Returns empty array if the standard is not recognized.
 */
export function getBatchesForStandard(standard: string): BatchOption[] {
  return BATCH_CONFIG.filter((b) => b.standard === standard);
}

/**
 * Returns a batch option by its ID, or undefined if not found.
 */
export function getBatchById(batchId: string): BatchOption | undefined {
  return BATCH_CONFIG.find((b) => b.batchId === batchId);
}

/**
 * Returns all standards that have batches configured, grouped.
 */
export function getBatchesGroupedByStandard(): Record<string, BatchOption[]> {
  const grouped: Record<string, BatchOption[]> = {};
  for (const std of STANDARDS) {
    grouped[std] = getBatchesForStandard(std);
  }
  return grouped;
}
