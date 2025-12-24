/**
 * Admin Setup Utility
 * Creates the initial admin account in Firebase Auth and Firestore
 *
 * USAGE:
 * 1. Update the admin credentials below
 * 2. Import this in App.js temporarily
 * 3. Call setupAdmin() once when the app loads
 * 4. Remove the import after setup is complete
 */

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const setupAdmin = async () => {
  // ADMIN CREDENTIALS - Change these to your desired admin credentials
  const adminEmail = 'admin@scienceverse.com';
  const adminPassword = 'admin123'; // Change this to a secure password
  const adminName = 'System Administrator';

  try {
    console.log('🔧 Setting up admin account...');

    // First, check if there's already a user with this email in Firestore
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', adminEmail)
    );
    const usersSnapshot = await getDocs(usersQuery);

    if (!usersSnapshot.empty) {
      console.log('✅ Admin account already exists in Firestore');
      const adminDoc = usersSnapshot.docs[0];
      console.log('Admin UID:', adminDoc.id);
      console.log('Admin data:', adminDoc.data());
      return {
        success: true,
        message: 'Admin account already exists',
        uid: adminDoc.id
      };
    }

    // Try to create the admin user in Firebase Auth
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('✅ Created admin in Firebase Auth');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️ Admin already exists in Firebase Auth, but not in Firestore');
        console.log('Please login as admin first, then this will create the Firestore document');
        return {
          success: false,
          message: 'Admin exists in Auth but not Firestore. Please login first.',
          error: error.message
        };
      }
      throw error;
    }

    const uid = userCredential.user.uid;

    // Create admin document in Firestore
    await setDoc(doc(db, 'users', uid), {
      uid: uid,
      email: adminEmail,
      name: adminName,
      role: 'admin',
      createdAt: new Date(),
      organization: 'Tenkasi District Science Competition',
      district: 'Tenkasi',
      state: 'Tamilnadu'
    });

    console.log('✅ Created admin document in Firestore');
    console.log('Admin UID:', uid);
    console.log('Admin Email:', adminEmail);
    console.log('Admin Name:', adminName);

    return {
      success: true,
      message: 'Admin account created successfully',
      uid: uid,
      email: adminEmail
    };

  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    return {
      success: false,
      message: 'Failed to create admin account',
      error: error.message
    };
  }
};

// Export credentials for reference
export const ADMIN_CREDENTIALS = {
  email: 'admin@scienceverse.com',
  password: 'admin123' // Change this!
};
