
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
import type { User } from '@/models/user.model';
import AdminHeader from './components/AdminHeader';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    // 1. If we are on the login page, do nothing. Let it render.
    if (pathname === '/admin/login') {
      setAuthStatus('unauthorized'); // Allows the login page to be rendered
      return;
    }

    // 2. If Firebase auth is still loading, wait.
    if (isUserLoading) {
      setAuthStatus('loading');
      return;
    }
    
    // 3. If no user is logged in at all, redirect to the admin login page.
    if (!user) {
      router.replace("/admin/login");
      setAuthStatus('unauthorized'); // Show loader during redirect
      return;
    }

    // 4. A user is logged in. Now, check their role from Firestore.
    const checkAdminRole = async () => {
      try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        const userData = userDoc.data() as User | undefined;

        if (userDoc.exists() && userData?.role?.toLowerCase() === 'admin') {
          setAuthStatus('authorized');
        } else {
          // If they don't have the admin role, show error and redirect.
          setAuthStatus('unauthorized');
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have administrative privileges.",
          });
          router.replace('/dashboard'); 
        }
      } catch (error) {
        console.error("Error checking admin role:", error);
        setAuthStatus('unauthorized');
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not verify your user role.",
        });
        router.replace('/dashboard');
      }
    };

    checkAdminRole();
  }, [user, isUserLoading, firestore, router, pathname, toast]);

  // Render based on authorization status

  // Case 1: On the login page, just render the page itself.
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }
  
  // Case 2: Still loading or checking auth. Show a full-page loader.
  if (authStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Case 3: Authorized. Render the full admin layout.
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
            <AdminHeader />
            {children}
          </main>
        </div>
        </SidebarProvider>
      );
  }

  // Case 4: Unauthorized and not on login page.
  // This state is temporary before a redirect, so a loader is appropriate.
  return (
    <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
    </div>
  );
}
