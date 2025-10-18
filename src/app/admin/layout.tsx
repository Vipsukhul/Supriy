
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    // Wait until Firebase has determined the initial auth state.
    if (isUserLoading) {
      return; 
    }

    // If there is no user, they should be on the login page.
    if (!user) {
      setIsCheckingRole(false);
      // If they are not already on the login page, redirect them.
      if (pathname !== '/admin/login') {
        router.replace("/admin/login");
      }
      return;
    }

    // A user is logged in. Now, check if they are an admin.
    const checkAdminRole = async () => {
      try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAuthorized(true);
        } else {
          // User is logged in but is NOT an admin.
          // Sign them out from the admin attempt and redirect to general login.
          await auth.signOut(); // Using auth from firebase context
          router.replace('/login');
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have administrative privileges.",
          });
        }
      } catch (error) {
        console.error("Error checking admin role:", error);
        router.replace('/login'); // Redirect on error for safety
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkAdminRole();
  }, [user, isUserLoading, firestore, router, pathname]);

  // If the user is trying to access the login page, let them.
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // While checking auth state or role, show a full-page loader.
  if (isUserLoading || isCheckingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Only render the admin layout if the user is a confirmed admin.
  if (!isAuthorized) {
    // This state is a fallback. The useEffect should handle redirection.
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
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
