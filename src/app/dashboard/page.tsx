"use client";

import { useAuth, useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/login");
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
      <p>You are logged in as {user.email}</p>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </div>
  );
}
