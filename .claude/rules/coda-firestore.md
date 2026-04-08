# Coda Firestore

Rules for using Firestore in this project. Database is in asia-east1.

## Project UID

Read the project UID from `.claude/rules/coda-secrets.md` or `CLAUDE.md`. The UID is a 6-character code (e.g. `k3x7a9`).

ALL collection names MUST be prefixed with `nu7cwo_` to isolate data per project.

## Cloud Functions (Backend)

Use `firebase-admin` SDK in Cloud Functions:

```javascript
const { getFirestore } = require("firebase-admin/firestore");
const db = getFirestore();

// Collection names: nu7cwo_collectionName
const docRef = db.collection("nu7cwo_users").doc("user123");
await docRef.set({ name: "Mark", email: "mark@example.com", createdAt: new Date() });
const doc = await docRef.get();
const snapshot = await db.collection("nu7cwo_users").where("name", "==", "Mark").get();
await docRef.update({ name: "Updated" });
await docRef.delete();
```

## Frontend (Client SDK)

Use `firebase/firestore` with Firebase Auth:

```javascript
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Always prefix collections with UID
const snapshot = await getDocs(query(collection(db, "nu7cwo_users"), where("email", "==", email)));
await addDoc(collection(db, "nu7cwo_contacts"), { name, phone, createdAt: new Date() });
```

## Security Rules

The project has `firestore.rules`. Default: require authentication for all reads/writes.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Rules

- ALL collection names MUST be prefixed with the project UID: `nu7cwo_collectionName`
- Examples: `nu7cwo_users`, `nu7cwo_contacts`, `nu7cwo_orders`
- ALL Firestore operations MUST require authentication (never leave rules open)
- Use `firebase-admin` in Cloud Functions, `firebase/firestore` in frontend
- Use `serverTimestamp()` for timestamps, not `new Date()` in frontend
- Collection names after prefix should be lowercase plural (e.g. `nu7cwo_users`)
- Use subcollections for nested data (e.g. `nu7cwo_users/{uid}/orders`)
- Always add pagination with `limit()` and `startAfter()` for large collections
- Deploy rules with `coda deploy` — rules are included automatically
