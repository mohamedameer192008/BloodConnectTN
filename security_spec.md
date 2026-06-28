# Firestore Security Specification & Hardening Spec

This document outlines the data invariants, threat model ("Dirty Dozen" payloads), and security rule specifications for the Tamil Nadu Voluntary Blood Donor Finder application.

## 1. Data Invariants

- **Users (`/users/{userId}`)**:
  - The document ID `{userId}` must strictly equal `request.auth.uid`.
  - The `email` field must equal the authenticated user's email: `incoming().email == request.auth.token.email`.
  - The `role` field cannot be modified or set to `'admin'` by regular users. Only existing admins can write or modify this field.

- **Donors (`/donors/{donorId}`)**:
  - An authenticated user can only create or update a donor document if the `emailAddress` matches their verified auth token email.
  - The `verified`, `blocked`, and `numDonations` fields are protected: they can only be changed by an administrator.
  - Non-admins cannot delete or modify donor records belonging to other users.

- **Emergency Requests (`/emergencyRequests/{requestId}`)**:
  - The `postedBy` field must match `request.auth.uid` on creation and remains immutable.
  - Only the creator of the request or an administrator can update the status or delete/cancel the request.

- **Notifications (`/notifications/{notificationId}`)**:
  - Notifications are strictly private. Read, write, and delete permissions are only granted if the recipient's identifier matches `request.auth.uid` or their associated `donorProfileId`.

- **Donation History (`/donationHistory/{historyId}`)**:
  - History entries can only be created, read, or modified by the associated donor or an administrator.

---

## 2. The "Dirty Dozen" Threat Payloads (Attack Vectors)

The following malicious payloads must be rejected by the security rules:

1. **Privilege Escalation on Signup**: A regular user registers and attempts to set their role to `'admin'` directly in `/users/{uid}`.
2. **Identity Spoofing in Donor Registration**: User `A` tries to register a donor document with user `B`'s email address in the payload.
3. **Unauthorized Donor Verification Bypass**: A donor tries to update their own profile to set `verified = true` without admin action.
4. **Unauthorized Blocking/Unblocking**: A regular user attempts to unblock their own blocked donor profile by submitting `blocked = false`.
5. **Vandalism (Arbitrary Profile Editing)**: User `A` attempts to update the contact details, name, or blood group of user `B`'s donor profile.
6. **Orphaned Emergency Requests**: A client attempts to create an emergency request with `postedBy` set to a non-existent user or another user's ID.
7. **Emergency Request Hijacking**: User `B` attempts to update the status of user `A`'s emergency request to `Fulfilled` or `Cancelled`.
8. **Malicious Request Deletion**: User `B` attempts to delete user `A`'s emergency request.
9. **Private Notification Snooping**: User `A` attempts to read notifications intended for user `B`.
10. **Notification Spam Creation**: An unauthenticated or random user attempts to write spam notifications into other users' feeds.
11. **Spoofed Admin Role Claim**: An attacker tries to pass a custom token claim `admin = true` or manipulate headers to bypass checks.
12. **Denial-of-Wallet Path Variable Poisoning**: An attacker makes high-volume requests using path parameters containing massive (>1MB) garbage strings to blow up query costs or index sizes.

---

## 3. Test Runner Design

All test payloads are validated against the Rules using the Firebase Rules Unit Testing library. Security rules must be set up to ensure mathematically guaranteed protection.
