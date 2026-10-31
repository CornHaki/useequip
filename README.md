# UseEquip

UseEquip is a React/Vite equipment-sharing application using Firebase Authentication (Email/Password) and Cloud Firestore. The application does not use Cloud Functions, Cloud Storage, or any Blaze-plan-only service.

## Firebase setup

1. Enable Email/Password in Firebase Authentication and create a Cloud Firestore database.
2. Register a Firebase web app and place its `apiKey`, `authDomain`, `projectId`, and `appId` in `.env.local` as `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID`.
3. Install dependencies and start the frontend:

   ```sh
   npm install
   npm run dev
   ```

4. Install Firebase CLI, sign in, and deploy only Firestore rules and indexes:

   ```sh
   firebase login
   firebase deploy --only firestore:rules,firestore:indexes --project cotton-mail
   ```

Firebase Hosting can be deployed separately if already configured. These commands do not deploy Functions or Storage.

## Accounts and roles

- Accounts register as either User or Admin using Firebase Email/Password authentication. Firebase Authentication enforces one account per email.
- Each Firestore profile stores one permanent `role` bound to its authenticated UID. Signup can create that profile, but Firestore Security Rules deny all profile updates and deletes.
- Login verifies the selected login role against the stored profile role. A mismatched login is rejected, and users cannot change to another role or switch dashboards.
- Admin accounts manage equipment and requests for their UID. User accounts can browse and request other people's equipment but cannot request an owner's own equipment.

## Firestore data and authorization

The app uses the existing `users`, `resources`, `bookings`, `equipmentReports`, `auditLogs`, and `notifications` collections. Booking, report, equipment, cancellation, and return operations write directly through Firestore transactions. `firestore.rules` checks caller identity, the immutable single role, ownership, and linked booking/resource transitions; records are retained instead of hard-deleted.

Equipment photos, report photos, and handover photos are compressed in the browser and stored as Firestore data URLs, with an encoded length limit of 250,000 characters per image. This avoids Cloud Storage, but is less storage-efficient. Older equipment documents that only reference a Cloud Storage `imagePath` need a new photo uploaded to display in the Spark-only app.

Booking records retain the existing internal lifecycle values for compatibility. The interface displays them as Pending, Approved, Waitlisted, Declined, Borrowed, Return Requested, and Returned. A return remains pending inspection until its equipment owner records the condition.

Deploy Firestore rules and indexes before using the updated client. For local verification, use the Firebase Emulator Suite with test accounts representing borrowers and equipment owners.
