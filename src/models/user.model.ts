
export type Role = "admin" | "Country Manager" | "Manager" | "Engineer" | "Guest";

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    mobileNumber: string;
    region: string;
    signUpDate: string;
    role: Role;
}
