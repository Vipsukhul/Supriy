
"use client";

import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarProvider } from '@/components/ui/sidebar';
import { Shield, Users, Home } from 'lucide-react';
import AdminSignOutButton from './components/AdminSignOutButton';
import { useUser, useFirestore } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized' | 'no-user'>('loading');

  useEffect(() => {
    // If Firebase auth is still loading, wait.
    if (isUserLoading) {
      setAuthStatus('loading');
      return;
    }

    // If the user is trying to access the login page, let them.
    if (pathname === '/admin/login') {
      // If a user is already logged in, they will be redirected by the login page itself.
      setAuthStatus('no-user'); // Treat as if no user is logged in for layout purposes.
      return;
    }

    // If there is no authenticated user, redirect to the admin login page.
    if (!user) {
      setAuthStatus('no-user');
      router.replace("/admin/login");
      return;
    }

    // A user is logged in. Now, check if they are an admin.
    const checkAdminRole = async () => {
      try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setAuthStatus('authorized');
        } else {
          // User is logged in but is NOT an admin.
          setAuthStatus('unauthorized');
          // Don't sign out here. Redirect to the main app dashboard.
          router.replace('/dashboard'); 
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have administrative privileges.",
          });
        }
      } catch (error) {
        console.error("Error checking admin role:", error);
        setAuthStatus('unauthorized'); // Treat errors as unauthorized.
        router.replace('/dashboard');
      }
    };

    checkAdminRole();
  }, [user, isUserLoading, firestore, router, pathname, toast]);

  // If the user is on the login page, render the children directly without the layout.
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // While checking auth state or role, show a full-page loader.
  if (authStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // If the user is authorized, render the full admin layout with its children.
  if (authStatus === 'authorized') {
    return (
      <SidebarProvider>
      <div className="flex min-h-screen bg-muted/40">
        <Sidebar side="left" className="w-64" collapsible="icon">
            <SidebarGroup>
              <SidebarGroupLabel>
                <Logo />
              </SidebarGroupLabel>
            </SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/admin/dashboard">
                  <SidebarMenuButton tooltip="Dashboard">
                    <Home />
                    Dashboard
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <Link href="/admin/management">
                      <SidebarMenuButton tooltip="Admin Management">
                          <Shield />
                          Admin Management
                      </SidebarMenuButton>
                  </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/admin/users">
                  <SidebarMenuButton tooltip="User Management">
                    <Users />
                    User Management
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          <div className="mt-auto">
              <SidebarMenu>
                  <SidebarMenuItem>
                      <AdminSignOutButton />
                  </SidebarMenuItem>
              </SidebarMenu>
          </div>
        </Sidebar>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
      </SidebarProvider>
    );
  }

  // For 'unauthorized' or 'no-user' states where it's not the login page,
  // we show a loader while the redirection (handled in useEffect) takes place.
  // This prevents content from flashing before the redirect is complete.
  return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
  );
}
