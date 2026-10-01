import { UserAvatarColor } from '../types/finance';

export const getAvatarColorClass = (color?: UserAvatarColor | string): string => {
  switch (color) {
    case 'rose':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    case 'indigo':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
    case 'amber':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    case 'sky':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800';
    case 'purple':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-800';
    case 'teal':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300 dark:border-teal-800';
    case 'orange':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-800';
    case 'emerald':
    default:
      return 'bg-emerald-100 text-[#15856c] dark:bg-emerald-950/80 dark:text-emerald-300 border-[#a8dec9] dark:border-emerald-800';
  }
};
