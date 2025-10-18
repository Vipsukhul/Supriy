"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page's sole purpose is to redirect from /admin to the /admin/login page.
export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/login');
  }, [router]);

  // Render a loading state or null while redirecting
  return null;
}
