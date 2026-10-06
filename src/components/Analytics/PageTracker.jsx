'use client';

import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/utils/dataLayer';

function PageTrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrl = useRef(null);

  useEffect(() => {
    if (!pathname) return;

    const queryString = searchParams?.toString();
    const currentPath = queryString ? `${pathname}?${queryString}` : pathname;

    const timer = setTimeout(() => {
      const fullUrl = typeof window !== 'undefined' ? window.location.href : currentPath;
      const title = typeof document !== 'undefined' ? document.title : 'Ekhone';

      if (lastTrackedUrl.current === currentPath) {
        return;
      }
      lastTrackedUrl.current = currentPath;

      trackPageView(fullUrl, title);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}

export default function PageTracker() {
  return (
    <Suspense fallback={null}>
      <PageTrackerContent />
    </Suspense>
  );
}
