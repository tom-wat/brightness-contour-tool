import { ImageFilterMethod } from '@/types/ImageFilterTypes';

/** Shared by the image filter and the frequency separation low-pass. */
export const FILTER_METHOD_LABELS: Record<ImageFilterMethod, string> = {
  gaussian: 'Gaussian blur',
  median: 'Median',
  bilateral: 'Bilateral',
  guided: 'Guided (fast)',
};
