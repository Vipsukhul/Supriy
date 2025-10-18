
export type Role = "admin" | "Country Manager" | "Manager" | "Engineer" | "Guest";

export interface User {
    uid: string; // Firebase Auth UID
    userId: string; // Custom, sequential user ID
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    region: string;
    signUpDate: string;
    role: Role;
}
