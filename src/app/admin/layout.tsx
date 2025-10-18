import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Home } from 'lucide-react';
import AdminSignOutButton from './components/AdminSignOutButton';


export const metadata: Metadata = {
  title: 'DebtFlow - Admin',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
    <div className="flex min-h-screen">
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
      <main className="flex-1">
        {children}
      </main>
    </div>
    </SidebarProvider>
  );
}
