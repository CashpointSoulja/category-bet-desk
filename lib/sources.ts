import type { SourceRef } from './model';

/** Public sources only. Accessed 6 October 2026. */
export const SOURCES = {
  jobPost: { label: 'YC job post: Special Projects Lead - Category Expansion', url: 'https://www.ycombinator.com/companies/fleek/jobs/Iopbt9d-special-projects-lead-category-expansion' },
  careers: { label: 'joinfleek.com/careers', url: 'https://www.joinfleek.com/careers' },
  home: { label: 'joinfleek.com home page', url: 'https://www.joinfleek.com/' },
  howItWorks: { label: 'joinfleek.com/pages/how-it-works', url: 'https://www.joinfleek.com/pages/how-it-works' },
  fortune: { label: 'Fortune, 8 Jul 2026: Fleek raises $25M Series B', url: 'https://fortune.com/2026/07/08/fleek-an-online-marketplace-connecting-vintage-clothing-wholesalers-and-retailers-raises-25-million-in-new-funding/' },
  tnw: { label: 'The Next Web, 8 Jul 2026: Fleek raises $25m', url: 'https://thenextweb.com/news/fleek-25m-series-b-secondhand-fashion-ai' },
  techcrunch: { label: 'TechCrunch, 12 Nov 2024: Fleek sews up $20.4M', url: 'https://techcrunch.com/2024/11/12/fleek-a-marketplace-for-wholesale-second-hand-clothes-sews-up-20m/' },
  trustpilot: { label: 'Trustpilot: Fleek reviews', url: 'https://uk.trustpilot.com/review/joinfleek.com' },
  kidswear: { label: 'joinfleek.com/category/kidswear', url: 'https://www.joinfleek.com/category/kidswear' },
  denim: { label: 'joinfleek.com/category/denim', url: 'https://www.joinfleek.com/category/denim' },
  y2kFlares: { label: 'joinfleek.com/collections/y2k-flared-jeans', url: 'https://www.joinfleek.com/collections/y2k-flared-jeans' },
  northFace: { label: 'joinfleek.com/collections/the-north-face', url: 'https://www.joinfleek.com/collections/the-north-face' },
  columbia: { label: 'joinfleek.com/collections/columbia', url: 'https://www.joinfleek.com/collections/columbia' },
  nikeTrack: { label: 'joinfleek.com/collections/tracksuit-nike-vintage-wholesale', url: 'https://www.joinfleek.com/collections/tracksuit-nike-vintage-wholesale' },
} satisfies Record<string, SourceRef>;

/** Listing prices on joinfleek.com are shown in USD to this visitor; the desk works in GBP. */
export const USD_TO_GBP = 0.75;
export const USD_TO_GBP_NOTE = 'Estimated conversion for comparing public USD listing prices with the GBP model. Not a quoted rate.';
