
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
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
import { Mail, Lock, User as UserIcon, Phone, Globe } from "lucide-react";
import { useAuth, useFirestore, useUser } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import type { User, Role } from "@/models/user.model";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  mobileNumber: z.string().min(10, { message: "Mobile number must be at least 10 digits." }),
  region: z.string().min(2, { message: "Region is required." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// This list defines who gets admin privileges upon signing up.
const adminEmails = ["vipsukhul@gmail.com", "supriysukhadev12@gmail.com", "amardiptirpude@gmail.com"];

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      mobileNumber: "",
      region: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    let userAuth;
    try {
      // 1. Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      userAuth = userCredential.user;

      const [firstName, ...lastNameParts] = values.name.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const role: Role = adminEmails.includes(values.email.toLowerCase()) ? 'admin' : 'Guest';

      // 2. Create the user document in Firestore for display and management purposes.
      const newUser: User = {
        id: userAuth.uid,
        firstName,
        lastName,
        email: values.email,
        mobileNumber: values.mobileNumber,
        region: values.region,
        signUpDate: new Date().toISOString(),
        role: role
      };
      
      const userDocRef = doc(firestore, "users", userAuth.uid);
      await setDoc(userDocRef, newUser);
      
      toast({
        title: "Signup Successful",
        description: "Your account has been created. You can now log in.",
      });

      router.push('/login');

    } catch (error: any) {
      console.error("Signup Error: ", error);
      let errorMessage = "An unexpected error occurred.";
       if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already in use.";
      } else if (error.message && error.message.includes('permission-denied')) {
          errorMessage = "Could not save user data due to security rules.";
          // If Firestore write fails, we must delete the created auth user to allow a retry.
          if (userAuth) {
            await userAuth.delete().catch(delErr => console.error("Failed to clean up auth user after firestore failure:", delErr));
          }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: errorMessage,
      });
    } finally {
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
        <CardTitle className="text-2xl font-headline">Create an account</CardTitle>
        <CardDescription>
          Enter your details below to create your account.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        placeholder="John Doe"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="m@example.com"
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
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="mobileNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                        <Input
                            placeholder="123-456-7890"
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
                name="region"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Region</FormLabel>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                        <Input
                            placeholder="e.g. California, USA"
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
            </div>
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
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
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:underline"
              >
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
