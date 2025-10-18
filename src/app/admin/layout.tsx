
"use client";

import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarProvider } from '@/components/ui/sidebar';
import { Shield, Users, Home } from 'lucide-react';
import AdminSignOutButton from './components/AdminSignOutButton';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '@/models/user.model';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      // Still waiting for Firebase to tell us if a user is logged in or not.
      return;
    }
    
    if (!user) {
      // No user is logged in, redirect to the admin login page.
      router.replace("/admin/login");
      return;
    }

    // A user is logged in. Now, check if they have the 'admin' role.
    const checkAdminRole = async () => {
      try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        } else {
          // User is logged in but is NOT an admin.
          // Sign them out from the admin attempt and redirect to general login.
          await user.getIdToken(true); // Refresh token to ensure rules are updated
          router.replace('/login'); 
        }
      } catch (error) {
        console.error("Error checking admin role:", error);
        router.replace('/login'); // Redirect on error for safety
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkAdminRole();
  }, [user, isUserLoading, firestore, router]);

  // While checking auth state or role, show a full-page loader.
  if (isUserLoading || isCheckingRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Only render the admin layout if the user is a confirmed admin.
  if (!isAdmin) {
     // This state should ideally not be reached due to redirects, but it's a fallback.
     // It might flash briefly during redirection.
     return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting...</p>
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
