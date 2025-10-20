# Application Flow and Role-Based Access Control

This document outlines the complete authentication flow, role-based access system, and data management architecture for the DebtFlow application.

## 1. Core Security Principle: Firebase Custom Claims

The entire role-based access control (RBAC) system is built on **Firebase Custom Claims**. This is the most secure and efficient method for managing user roles.

- When a user's role is set (either during signup for an admin or by an existing admin), a special property (`role: 'admin'`) is embedded directly into that user's Firebase Authentication token.
- This token is securely managed by Firebase and is sent with every request to Firestore.
- Our Firestore Security Rules do not need to read the database to check a user's role. Instead, they instantly and efficiently read the role from the token: `request.auth.token.role`.

This avoids the "catch-22" paradox of needing database access to grant database access and is the foundation of the entire system.

---

## 2. User Roles

The application defines the following roles, each with specific permissions:

- **admin:** Can do everything. Manages users, can see all data, can assign engineers.
- **Country Manager:** Can view all data, manage remarks/notes, and assign engineers within any region.
- **Manager:** Can view and edit data (remarks, notes, invoices) and assign engineers, but **only for their specific region**.
- **Engineer:** Can view and edit data (remarks, notes, invoices) **only for customers they are assigned to**.
- **Guest:** The default role for new users. Can only log in and view their own profile. Has no access to financial data.

---

## 3. Authentication and Role Assignment Flow

### A. New User Signup (Guest)

1.  A new user fills out the signup form (`/signup`).
2.  The application calls `createUserWithEmailAndPassword` to create an account in the **Firebase Authentication** service.
3.  A Genkit flow (`generateUserId`) is called to create a unique, sequential user ID (e.g., `joh000001`).
4.  The application then attempts to write a new document to the `/users` collection in **Firestore**. This document contains the Firebase UID, the new sequential `userId`, and sets their `role` to **`Guest`**.
5.  A security rule (`allow create: if request.auth.uid == userId;`) specifically permits this initial write, but only for the user's own document.
6.  The user is logged in and redirected to the dashboard. Their auth token has no custom role claim.

### B. Admin Signup (Critical Flow)

This flow is special and applies ONLY to a predefined list of admin emails in the signup page's code.

1.  A user with an admin email (e.g., `vipsukhul@gmail.com`) signs up.
2.  The `createUserWithEmailAndPassword` and `generateUserId` steps are the same.
3.  The Firestore document is created with the `role` field set to **`admin`**.
4.  **Crucially**, the application then calls the `setRole` Genkit flow on the server. This flow uses the **Firebase Admin SDK** to set a custom claim on the user's auth record: `{ role: 'admin' }`.
5.  After the claim is set, the application **forcibly signs the new admin out**.
6.  A toast message appears, instructing the new admin that their account is ready and they must **log in again**.
7.  **Why?** This sign-out/sign-in cycle is **ESSENTIAL**. When they log back in, Firebase issues a brand new authentication token, which now contains the `role: 'admin'` custom claim. Without this, they would still be treated as a guest.

### C. Standard Login

1.  A user logs in via the `/login` page.
2.  Firebase Authentication verifies their credentials and issues an authentication token.
3.  If the user has a custom role claim (like an admin), that claim is automatically included in the token.
4.  The application redirects them to the dashboard.

---

## 4. Data Access and Security Rules Flow

All data access is governed by `firestore.rules`.

### Listing Users (`/datasheet`, `/admin/users`)

- **Action:** The Datasheet page needs to fetch all users with the 'Engineer' role for the "Assign to" dropdown.
- **Rule:** `allow list: if request.auth.token.role in ['admin', 'Country Manager', 'Manager'];`
- **Flow:**
    1. The user visits the Datasheet page.
    2. The app queries the `/users` collection.
    3. Firestore checks the user's auth token.
    4. If `token.role` is 'admin', 'Country Manager', or 'Manager', the request is **allowed**.
    5. If the token has no role claim or a different role, the request is **denied**, and a "Missing or insufficient permissions" error occurs.

### Editing a Financial Record (`/datasheet`)

- **Action:** A Manager from the "USA" region tries to update the "Remarks" for a customer in the "USA" region.
- **Rule:** `allow write: if request.auth.token.role == 'Country Manager' || (request.auth.token.role == 'Manager' && resource.data.region == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.region) || ...`
- **Flow:**
    1. The Manager makes a change in the UI.
    2. The app sends an `updateDoc` request for the specific financial record.
    3. Firestore checks the user's auth token. It sees `token.role` is 'Manager'.
    4. Because it's a Manager, the rule proceeds to the next check: it reads the incoming data (`resource.data.region`, which is "USA") and compares it to the manager's own region stored in their user document.
    5. Since both regions match, the `write` is **allowed**. If the customer was in the "Europe" region, the write would be **denied**.

This same token-based logic applies to all create, update, and delete operations throughout the application, providing a secure and robust system.
