
"use client";

import { useMemo, useState } from "react";
import { collection, query, where } from "firebase/firestore";
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
import type { User } from "@/models/user.model";
import { useMemoFirebase } from "@/firebase/provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddUserDialog } from "../users/components/add-user-dialog";

export default function AdminManagementPage() {
  const firestore = useFirestore();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);


  const adminsQuery = useMemoFirebase(() => {
    const usersRef = collection(firestore, 'users');
    return query(usersRef, where('role', '==', 'admin'));
  }, [firestore]);

  const { data: admins, isLoading: adminsLoading, error } = useCollection<User>(adminsQuery);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  }

  if (adminsLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
            <Button disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Admin
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Administrator Accounts</CardTitle>
                <CardDescription>Manage permissions and access for all administrators.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
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
        allowedRoles={["admin"]}
        defaultRole="admin"
        title="Add New Admin"
        description="Create a new administrator account. This will grant them full access to the admin portal."
      />
      <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Admin Management</h1>
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Admin
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Administrator Accounts</CardTitle>
            <CardDescription>Manage permissions and access for all administrators.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins && admins.length > 0 ? (
                    admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                                  <AvatarImage data-ai-hint="person" src={`https://i.pravatar.cc/40?u=${admin.id}`} />
                                  <AvatarFallback>{getInitials(admin.firstName, admin.lastName)}</AvatarFallback>
                              </Avatar>
                              <div>
                                  <div className="font-medium">{admin.firstName} {admin.lastName} <Badge variant="outline">Default</Badge></div>
                                  <div className="text-sm text-muted-foreground">{admin.email}</div>
                              </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select defaultValue="full-control">
                              <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select permission" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="full-control">Full Control</SelectItem>
                                  <SelectItem value="limited-access">Limited Access</SelectItem>
                              </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {new Date(admin.signUpDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <DropdownMenuItem>Revoke Access</DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        {error ? 'You do not have permission to view admins.' : 'No admins found.'}
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
