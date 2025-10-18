
"use client";

import { useFirestore, useUser } from "@/firebase";
import { useDoc } from "@/firebase/firestore/use-doc";
import { useMemoFirebase } from "@/firebase/provider";
import { doc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { User } from "@/models/user.model";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";

export default function CheckRolePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc<User>(userDocRef);

  const isLoading = isUserLoading || isUserDataLoading;

  return (
    <div className="flex justify-center items-start py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Role Verification</CardTitle>
          <CardDescription>
            This page shows the role associated with your account in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : user && userData ? (
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Logged-In Email</p>
                <p className="text-lg font-semibold">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Database Role</p>
                <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'} className="text-lg">
                  {userData.role}
                </Badge>
              </div>
              {userData.role === 'admin' ? (
                <div className="pt-4">
                  <p className="text-sm text-center text-green-600 dark:text-green-400 mb-4">
                    Admin role confirmed. You should have access to the admin portal.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/admin">
                      Go to Admin Portal
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="pt-4 text-center text-orange-600 dark:text-orange-400 flex items-center justify-center flex-col gap-2">
                  <ShieldAlert className="h-8 w-8" />
                  <p className="font-semibold">Your role is '{userData.role}'.</p>
                  <p className="text-sm text-muted-foreground">You do not have administrative privileges.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-destructive-foreground">
              Could not retrieve user data. Please try again.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
