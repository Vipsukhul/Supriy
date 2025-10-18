
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
  
  const [authStatus, setAuthStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    // Let the login page render without any checks.
    if (pathname === '/admin/login') {
      setAuthStatus('unauthorized'); // Effectively, don't render the protected layout.
      return;
    }

    // If Firebase auth is still loading, wait.
    if (isUserLoading) {
      setAuthStatus('loading');
      return;
    }
    
    // If no user is logged in, redirect to login page.
    if (!user) {
      router.replace("/admin/login");
      // Set status to loading to show spinner during redirect.
      setAuthStatus('loading');
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
          setAuthStatus('unauthorized');
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have administrative privileges.",
          });
          // Redirect to a non-admin page.
          router.replace('/dashboard'); 
        }
      } catch (error) {
        console.error("Error checking admin role:", error);
        setAuthStatus('unauthorized');
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not verify user role.",
        });
        router.replace('/dashboard');
      }
    };

    checkAdminRole();
  }, [user, isUserLoading, firestore, router, pathname, toast]);

  // If we are on the login page, just render the children.
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }
  
  // While checking auth state or if redirecting, show a full-page loader.
  if (authStatus !== 'authorized') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // If the user is authorized, render the full admin layout with its children.
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
