
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait until the initial user loading is complete
    if (isUserLoading) {
      return;
    }
    
    // If no user is logged in, redirect to the admin login page.
    if (!user) {
      router.push("/admin/login");
      return;
    }

    const checkAdminRole = async () => {
      try {
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          if (userData.role === 'admin') {
            setIsAdmin(true);
          } else {
            // If the user is not an admin, deny access and redirect.
            router.push('/login'); 
          }
        } else {
           // If there's no user document, they can't be an admin.
           router.push('/login');
        }
      } catch (error) {
        console.error("Error checking admin role:", error);
        router.push('/login'); // Redirect on error
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminRole();
  }, [user, isUserLoading, firestore, router]);

  // While checking the user's role, show a loader.
  if (isLoading || isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // Only render the admin layout if the user is a confirmed admin.
  if (!isAdmin) {
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
