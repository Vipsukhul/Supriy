
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, useUser } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { regions } from "@/lib/regions";
import { Role } from "@/models/user.model";
import { getUsersForRole, generatePassword } from "@/lib/predefined-users";

const formSchema = z.object({
  role: z.custom<Role>(),
  region: z.string().optional(),
  email: z.string().email(),
});

const ROLES: Omit<Role, 'Guest' | 'admin'>[] = ["Country Manager", "Manager", "Engineer"];

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      region: undefined,
    },
  });

  const watchRole = form.watch("role");

  const availableUsers = useMemo(() => {
    if (!watchRole) return [];
    return getUsersForRole(watchRole);
  }, [watchRole]);

  useEffect(() => {
    if (watchRole !== selectedRole) {
      setSelectedRole(watchRole);
      form.reset({ ...form.getValues(), region: undefined, email: undefined });
    }
  }, [watchRole, form, selectedRole]);

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const password = generatePassword(values.role, values.region);

    if (!password) {
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Could not determine the correct password for the selected role and region.",
        });
        setIsSubmitting(false);
        return;
    }

    try {
      await signInWithEmailAndPassword(auth, values.email, password);
      toast({
        title: "Login Successful",
        description: "Welcome!",
      });
      // The useEffect will handle the redirect
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred. Please check your selections.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid credentials for the selected role/region. Please ensure the user exists in Firebase Authentication.";
      }
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
      setIsSubmitting(false);
    }
  }

  if (isUserLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Welcome to DebtFlow</CardTitle>
        <CardDescription>
          Please select your role and region to log in.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLES.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchRole && watchRole !== 'Country Manager' && (
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.map(region => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {watchRole && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>User</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select user account" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {availableUsers.map(user => (
                                    <SelectItem key={user.email} value={user.email}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full !mt-8" disabled={isSubmitting || !form.formState.isValid}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
