
"use client";

import { useState } from "react";
import { collection, doc, updateDoc } from "firebase/firestore";
import { useCollection, useFirestore } from "@/firebase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Role, User } from "@/models/user.model";
import { useMemoFirebase } from "@/firebase/provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AddUserDialog } from "./components/add-user-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setRole } from "@/ai/flows/set-role-flow";
import { useToast } from "@/hooks/use-toast";

export default function UserManagementPage() {
  const firestore = useFirestore();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const { toast } = useToast();

  const usersCollectionRef = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: users, isLoading: usersLoading, error } = useCollection<User>(usersCollectionRef);

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  }
  
  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
        // This Genkit flow is a server-side operation to securely set a custom claim.
        await setRole({ userId, role: newRole });
        
        // Also update the role in the Firestore document for display purposes.
        const userDocRef = doc(firestore, "users", userId);
        await updateDoc(userDocRef, { role: newRole });

        toast({
            title: "Role Updated",
            description: `User role has been changed to ${newRole}. The user must sign out and sign back in for the change to take full effect.`,
        });

    } catch (e: any) {
        console.error("Failed to set role:", e);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: `Could not update role: ${e.message}`,
        });
    }
  };

  if (usersLoading) {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>A list of all users in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Mobile Number</TableHead>
                                    <TableHead>Region</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Sign Up Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-1">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  return (
    <>
    <AddUserDialog 
        isOpen={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        allowedRoles={["admin", "Country Manager", "Manager", "Engineer", "Guest"]}
        defaultRole="admin"
    />
    <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
        <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create User
        </Button>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>A list of all users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Mobile Number</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Sign Up Date</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users && users.length > 0 ? (
                    users.map((user) => (
                        <TableRow key={user.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage data-ai-hint="person" src={`https://i.pravatar.cc/40?u=${user.id}`} />
                                    <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>{user.mobileNumber}</TableCell>
                        <TableCell>{user.region}</TableCell>
                        <TableCell>
                            <Select defaultValue={user.role} onValueChange={(newRole) => handleRoleChange(user.id, newRole as Role)}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">admin</SelectItem>
                                    <SelectItem value="Country Manager">Country Manager</SelectItem>
                                    <SelectItem value="Manager">Manager</SelectItem>
                                    <SelectItem value="Engineer">Engineer</SelectItem>
                                    <SelectItem value="Guest">Guest</SelectItem>
                                </SelectContent>
                            </Select>
                        </TableCell>
                        <TableCell>{new Date(user.signUpDate).toLocaleDateString()}</TableCell>
                         <TableCell>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem>Edit User</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">Delete User</DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                        {error ? 'You do not have permission to view users.' : 'No users found.'}
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}

    