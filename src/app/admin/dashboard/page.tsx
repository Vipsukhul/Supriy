"use client";

import { useAuth, useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/admin/login");
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/admin/login");
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
      <h1 className="text-2xl font-bold">Welcome to the Admin Dashboard</h1>
      <p>You are logged in as {user.email}</p>
      <p className="text-sm text-muted-foreground">This is a protected area for administrators.</p>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </div>
  );
}
