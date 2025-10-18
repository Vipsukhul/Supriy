"use client";

import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export default function AdminSignOutButton() {
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/admin/login");
  };

  return (
    <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
        <LogOut />
        Sign Out
    </SidebarMenuButton>
  );
}
