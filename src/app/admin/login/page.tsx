
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input";
import { Mail, Lock } from "lucide-react";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { doc, getDoc } from "firebase/firestore";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  // This useEffect will run when the user state changes.
  // The AdminLayout is the primary gatekeeper, but this can help redirect
  // a user who is already logged in and lands on this page.
  useEffect(() => {
    if (!isUserLoading && user) {
        // A user is logged in. The AdminLayout will handle role checking.
        // We'll push to dashboard, and the layout will intercept if they aren't an admin.
        router.push('/admin/dashboard');
    }
  }, [user, isUserLoading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const loggedInUser = userCredential.user;

      const userDocRef = doc(firestore, "users", loggedInUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().role === 'admin') {
          toast({
            title: "Admin Login Successful",
            description: "Welcome back! Redirecting...",
          });
          // On successful admin login, the `user` state will update,
          // and the useEffect above will trigger the redirect to the dashboard.
      } else {
          // If the user is not an admin, sign them out immediately and show an error.
          await auth.signOut();
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have administrative privileges.",
          });
      }
    } catch (error: any) {
        let errorMessage = "An unexpected error occurred.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = "Invalid email or password.";
        }
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: errorMessage,
        });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  // While the initial user authentication is loading, or if a user is found (and redirection is happening),
  // show the loading spinner.
  if (isUserLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }
  
  // Once loading is complete and we know there is no user, show the login form.
  return (
     <div className="min-h-screen bg-background flex items-center justify-center p-4">
       <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
              <Link href="/">
                <Logo />
              </Link>
          </div>
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-headline">Admin Panel</CardTitle>
              <CardDescription>
                Please login to continue.
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="admin@example.com"
                              {...field}
                              className="pl-10"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              className="pl-10"
                              disabled={isSubmitting}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Logging in...' : 'Login'}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
     </div>
  );
}
