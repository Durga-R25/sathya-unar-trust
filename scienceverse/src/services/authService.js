import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Authentication Service
 * Handles all Firebase Authentication and user management
 * Phase A: Core Authentication
 * Phase B: Role-Based Access Control
 */

// ============================================================================
// PHASE A: CORE AUTHENTICATION
// ============================================================================

/**
 * Validate School ID format
 * Format: STATE-DISTRICT-SCHOOL-STUDENTID (e.g., TN-TEN-GOV123-ST456)
 */
export const validateSchoolId = (schoolId) => {
  const schoolIdRegex = /^[A-Z]{2}-[A-Z]{3,4}-[A-Z0-9]{3,8}-[A-Z0-9]{3,8}$/;
  return schoolIdRegex.test(schoolId);
};

/**
 * Student Activation Flow (Hybrid Approach - Phase A.1.C)
 * 1. Teacher creates student account with School ID
 * 2. Student receives activation code/link
 * 3. Student activates account by setting password
 */

/**
 * Teacher creates student account (Step 1)
 * Creates pending activation record in Firestore
 */
export const createStudentAccount = async (studentData) => {
  try {
    const { schoolId, name, schoolName, class: studentClass, district, state, teacherId } = studentData;

    // Normalize School ID to uppercase for consistent checking
    const normalizedSchoolId = schoolId.toUpperCase();

    console.log('=== CREATING STUDENT ACCOUNT ===');
    console.log('School ID:', normalizedSchoolId);
    console.log('Teacher ID:', teacherId);
    console.log('Current auth user:', auth.currentUser?.uid);

    // Validate School ID format
    if (!validateSchoolId(normalizedSchoolId)) {
      throw new Error('Invalid School ID format. Use: STATE-DISTRICT-SCHOOL-STUDENTID');
    }

    console.log('Step 1: Checking for duplicate School ID in users collection...');
    // Check if School ID already exists in users collection
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('schoolId', '==', normalizedSchoolId));

    try {
      const existingUsers = await getDocs(q);
      console.log('✓ Users query successful. Found', existingUsers.size, 'existing users');

      if (!existingUsers.empty) {
        throw new Error('This School ID is already registered. Please use a different School ID.');
      }
    } catch (queryError) {
      console.error('✗ Error querying users collection:', queryError);
      throw new Error('Permission error when checking existing users: ' + queryError.message);
    }

    console.log('Step 1b: Checking for duplicate student name in same school...');
    // Check if student name already exists in the same school
    const nameQuery = query(
      usersRef,
      where('schoolName', '==', schoolName),
      where('name', '==', name),
      where('role', '==', 'student')
    );

    try {
      const existingStudentNames = await getDocs(nameQuery);
      console.log('✓ Name query successful. Found', existingStudentNames.size, 'students with same name in school');

      if (!existingStudentNames.empty) {
        throw new Error(`A student named "${name}" already exists in ${schoolName}. Please use a different name or add a distinguishing detail (e.g., "${name} - Class ${studentClass}").`);
      }
    } catch (queryError) {
      console.error('✗ Error checking duplicate name:', queryError);
      throw new Error('Permission error when checking duplicate names: ' + queryError.message);
    }

    console.log('Step 2: Checking for duplicate School ID in pending activations...');
    // Check pending activations
    const pendingRef = collection(db, 'pendingActivations');
    const pendingQuery = query(pendingRef, where('schoolId', '==', normalizedSchoolId));

    try {
      const existingPending = await getDocs(pendingQuery);
      console.log('✓ Pending activations query successful. Found', existingPending.size, 'pending');

      if (!existingPending.empty) {
        throw new Error('This School ID already has a pending activation. Please use a different School ID.');
      }
    } catch (queryError) {
      console.error('✗ Error querying pendingActivations collection:', queryError);
      throw new Error('Permission error when checking pending activations: ' + queryError.message);
    }

    console.log('Step 2b: Checking for duplicate student name in pending activations...');
    // Check if student name already exists in pending activations for same school
    const pendingNameQuery = query(
      pendingRef,
      where('schoolName', '==', schoolName),
      where('name', '==', name),
      where('activated', '==', false)
    );

    try {
      const existingPendingNames = await getDocs(pendingNameQuery);
      console.log('✓ Pending name query successful. Found', existingPendingNames.size, 'pending students with same name');

      if (!existingPendingNames.empty) {
        throw new Error(`A pending student account with the name "${name}" already exists for ${schoolName}. Please use a different name or check if this student was already created.`);
      }
    } catch (queryError) {
      console.error('✗ Error checking pending duplicate names:', queryError);
      throw new Error('Permission error when checking pending names: ' + queryError.message);
    }

    // Generate activation code (6-digit)
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

    console.log('Step 3: Creating pending activation record...');

    // Create pending activation record
    const pendingDocRef = doc(collection(db, 'pendingActivations'));

    try {
      await setDoc(pendingDocRef, {
        schoolId: normalizedSchoolId,
        name,
        schoolName,
        class: studentClass,
        district,
        state,
        teacherId,
        activationCode,
        createdAt: serverTimestamp(),
        activated: false,
        role: 'student'
      });
      console.log('✓ Student account created successfully!');
    } catch (writeError) {
      console.error('✗ Error writing to pendingActivations:', writeError);
      console.error('Write error code:', writeError.code);
      console.error('Write error message:', writeError.message);
      throw new Error('Permission error when creating student record: ' + writeError.message);
    }

    return {
      success: true,
      name,
      schoolId: normalizedSchoolId,
      activationCode,
      message: 'Student account created. Please share the School ID and activation code with the student.'
    };
  } catch (error) {
    console.error('=== ERROR CREATING STUDENT ACCOUNT ===');
    console.error('Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
};

/**
 * Student activates account (Step 2)
 * Sets password and creates Firebase Auth account
 */
export const activateStudentAccount = async (schoolId, activationCode, password) => {
  try {
    // Validate School ID format
    if (!validateSchoolId(schoolId.toUpperCase())) {
      throw new Error('Invalid School ID format');
    }

    // Find pending activation
    const pendingRef = collection(db, 'pendingActivations');
    const q = query(
      pendingRef,
      where('schoolId', '==', schoolId.toUpperCase()),
      where('activationCode', '==', activationCode)
    );
    const pendingSnap = await getDocs(q);

    if (pendingSnap.empty) {
      throw new Error('Invalid School ID or activation code');
    }

    const pendingDoc = pendingSnap.docs[0];
    const pendingData = pendingDoc.data();

    if (pendingData.activated) {
      throw new Error('This account has already been activated');
    }

    // Create Firebase Auth account (using School ID as email)
    // Format: schoolid@scienceverse.internal
    const email = `${schoolId.toLowerCase().replace(/-/g, '')}@scienceverse.internal`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      schoolId: schoolId.toUpperCase(),
      name: pendingData.name,
      schoolName: pendingData.schoolName,
      class: pendingData.class,
      district: pendingData.district,
      state: pendingData.state,
      role: 'student',
      email: email,
      createdAt: serverTimestamp(),
      activatedAt: serverTimestamp(),
      createdBy: pendingData.teacherId
    });

    // Mark activation as completed
    await updateDoc(doc(db, 'pendingActivations', pendingDoc.id), {
      activated: true,
      activatedAt: serverTimestamp(),
      userId: user.uid
    });

    return {
      success: true,
      user: {
        uid: user.uid,
        schoolId: schoolId.toUpperCase(),
        name: pendingData.name,
        class: pendingData.class,
        district: pendingData.district,
        state: pendingData.state,
        role: 'student',
        schoolName: pendingData.schoolName
      }
    };
  } catch (error) {
    console.error('Error activating student account:', error);
    throw error;
  }
};

/**
 * Login for Students (using School ID)
 * Converts School ID to email format for Firebase Auth
 */
export const loginWithSchoolId = async (schoolId, password) => {
  try {
    // Validate School ID format
    if (!validateSchoolId(schoolId.toUpperCase())) {
      throw new Error('Invalid School ID format');
    }

    // Convert School ID to email format
    const email = `${schoolId.toLowerCase().replace(/-/g, '')}@scienceverse.internal`;

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    const userData = userDoc.data();

    return {
      success: true,
      user: {
        uid: user.uid,
        ...userData
      }
    };
  } catch (error) {
    console.error('Error logging in with School ID:', error);
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      throw new Error('Invalid School ID or password');
    }
    throw error;
  }
};

/**
 * Login for Teacher/Judge/Admin (using Email)
 */
export const loginWithEmail = async (email, password) => {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      throw new Error('User data not found');
    }

    const userData = userDoc.data();

    // Verify role is not student
    if (userData.role === 'student') {
      throw new Error('Please login with your School ID');
    }

    return {
      success: true,
      user: {
        uid: user.uid,
        ...userData
      }
    };
  } catch (error) {
    console.error('Error logging in with email:', error);
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      throw new Error('Invalid email or password');
    }
    throw error;
  }
};

/**
 * Forgot Password (Phase A.2)
 * Send password reset email
 */
export const sendPasswordReset = async (emailOrSchoolId) => {
  try {
    // Students use a fake @scienceverse.internal email — Firebase cannot send
    // password reset emails to these. Direct them to their teacher instead.
    if (validateSchoolId(emailOrSchoolId.toUpperCase())) {
      // Look up the student's teacher from Firestore to give a specific contact
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('schoolId', '==', emailOrSchoolId.toUpperCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        throw new Error('No account found for this School ID. Please check the ID and try again.');
      }

      const studentData = snap.docs[0].data();
      const schoolName = studentData.schoolName || 'your school';

      return {
        success: true,
        message: `Student passwords can only be reset by a teacher or admin.\n\nPlease contact your teacher at ${schoolName} and ask them to reset your password from the Admin panel.`
      };
    }

    // Teacher / Judge / Admin — use real email, Firebase handles it
    await sendPasswordResetEmail(auth, emailOrSchoolId);

    return {
      success: true,
      message: 'Password reset email sent! Please check your inbox (and spam folder).'
    };
  } catch (error) {
    console.error('Error sending password reset:', error);
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address. Please check and try again.');
    }
    throw error;
  }
};

/**
 * Logout
 */
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// ============================================================================
// PHASE B: ROLE-BASED ACCESS CONTROL
// ============================================================================

/**
 * Check if user has permission for an action
 */
export const checkPermission = (user, action) => {
  if (!user || !user.role) {
    return false;
  }

  const permissions = {
    // Admin permissions
    admin: ['upload', 'evaluate', 'viewAdmin', 'manageUsers', 'manageSettings', 'viewAllData'],

    // Judge permissions
    judge: ['evaluate', 'viewAssignedVideos'],

    // Teacher permissions
    teacher: ['evaluate', 'createStudents', 'viewSchoolData'],

    // Student permissions
    student: ['upload', 'evaluate', 'viewOwnData']
  };

  const userPermissions = permissions[user.role] || [];
  return userPermissions.includes(action);
};

/**
 * Check if user can upload videos (Phase B.1)
 * Students, Teachers, and Admins can upload (case-insensitive)
 * Teachers upload on behalf of their students
 */
export const canUploadVideo = (user) => {
  if (!user || !user.role) return false;
  const role = user.role.toLowerCase();
  return role === 'student' || role === 'teacher' || role === 'admin';
};

/**
 * Check if user can access Admin Panel (Phase B.5)
 * Only admin role (case-insensitive)
 */
export const canAccessAdminPanel = (user) => {
  return user && user.role && user.role.toLowerCase() === 'admin';
};

/**
 * Check if user can evaluate a video (Phase B.2, B.4)
 * - Students cannot evaluate their own videos
 * - Teachers cannot evaluate their own school's videos
 * - Judges can only evaluate assigned videos
 */
export const canEvaluateVideo = async (user, video) => {
  if (!user || !video) {
    return { allowed: false, reason: 'Invalid user or video' };
  }

  // Phase B.2: Block self-evaluation for students
  if (user.role === 'student') {
    if (video.uploadedBy === user.uid) {
      return { allowed: false, reason: 'You cannot evaluate your own video' };
    }
    return { allowed: true };
  }

  // Phase B.4: Teachers can only evaluate other schools
  if (user.role === 'teacher') {
    if (video.schoolName === user.schoolName) {
      return { allowed: false, reason: 'You cannot evaluate videos from your own school' };
    }
    return { allowed: true };
  }

  // Phase B.3: Judges can only evaluate assigned videos
  if (user.role === 'judge') {
    // Check if video is assigned to this judge
    const assignedVideos = await getAssignedVideosForJudge(user.uid);
    const isAssigned = assignedVideos.some(v => v.videoId === video.videoId);

    if (!isAssigned) {
      return { allowed: false, reason: 'This video is not assigned to you' };
    }
    return { allowed: true };
  }

  // Admin can evaluate any video
  if (user.role === 'admin') {
    return { allowed: true };
  }

  return { allowed: false, reason: 'Invalid role' };
};

/**
 * Get videos assigned to a judge (Phase B.3)
 */
export const getAssignedVideosForJudge = async (judgeUid) => {
  try {
    const assignmentsRef = collection(db, 'judgeAssignments');
    const q = query(assignmentsRef, where('judgeUid', '==', judgeUid));
    const snapshot = await getDocs(q);

    const assignedVideos = [];
    snapshot.forEach(doc => {
      assignedVideos.push({ id: doc.id, ...doc.data() });
    });

    return assignedVideos;
  } catch (error) {
    console.error('Error getting assigned videos:', error);
    return [];
  }
};

/**
 * Calculate evaluation weight based on role (Phase B.4)
 * Judge: 70%, Teacher: 20%, Student: 10%
 */
export const getEvaluationWeight = (role) => {
  const weights = {
    judge: 0.7,
    teacher: 0.2,
    student: 0.1,
    admin: 0.7 // Admin evaluations have judge weight
  };

  return weights[role] || 0;
};

/**
 * Update student account information
 * Only admins and the teacher who created the student can update
 */
export const updateStudentAccount = async (studentId, updateData) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    // Get current user data
    const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!currentUserDoc.exists()) {
      throw new Error('Current user data not found');
    }

    const currentUserData = currentUserDoc.data();
    const isAdmin = currentUserData.role?.toLowerCase() === 'admin';

    // Get student data to check permissions
    const studentDoc = await getDoc(doc(db, 'users', studentId));
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }

    const studentData = studentDoc.data();
    const isCreator = studentData.createdBy === currentUser.uid;

    // Check permissions
    if (!isAdmin && !isCreator) {
      throw new Error('You do not have permission to update this student');
    }

    // Update student document
    await updateDoc(doc(db, 'users', studentId), {
      ...updateData,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    });

    return {
      success: true,
      message: 'Student information updated successfully'
    };
  } catch (error) {
    console.error('Error updating student account:', error);
    throw error;
  }
};

/**
 * Delete student account and all related data
 * Only admins and the teacher who created the student can delete
 * Deletes: user document, videos, evaluations, pending activations
 */
export const deleteStudentAccount = async (studentId) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    // Get current user data
    const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!currentUserDoc.exists()) {
      throw new Error('Current user data not found');
    }

    const currentUserData = currentUserDoc.data();
    const isAdmin = currentUserData.role?.toLowerCase() === 'admin';

    // Get student data to check permissions
    const studentDoc = await getDoc(doc(db, 'users', studentId));
    if (!studentDoc.exists()) {
      throw new Error('Student not found');
    }

    const studentData = studentDoc.data();
    const isCreator = studentData.createdBy === currentUser.uid;

    // Check permissions
    if (!isAdmin && !isCreator) {
      throw new Error('You do not have permission to delete this student');
    }

    // Delete student's videos
    const videosRef = collection(db, 'videos');
    const videosQuery = query(videosRef, where('uploadedBy', '==', studentId));
    const videosSnapshot = await getDocs(videosQuery);

    const deletePromises = [];

    // Delete all videos
    videosSnapshot.forEach(videoDoc => {
      deletePromises.push(deleteDoc(doc(db, 'videos', videoDoc.id)));
    });

    // Delete student's evaluations (as evaluator)
    const evaluationsRef = collection(db, 'evaluations');
    const evalQuery = query(evaluationsRef, where('evaluatorId', '==', studentId));
    const evalSnapshot = await getDocs(evalQuery);

    evalSnapshot.forEach(evalDoc => {
      deletePromises.push(deleteDoc(doc(db, 'evaluations', evalDoc.id)));
    });

    // Delete evaluations on student's videos
    videosSnapshot.forEach(async (videoDoc) => {
      const videoEvalQuery = query(evaluationsRef, where('videoId', '==', videoDoc.id));
      const videoEvalSnapshot = await getDocs(videoEvalQuery);
      videoEvalSnapshot.forEach(evalDoc => {
        deletePromises.push(deleteDoc(doc(db, 'evaluations', evalDoc.id)));
      });
    });

    // Wait for all deletions to complete
    await Promise.all(deletePromises);

    // Finally, delete the user document
    await deleteDoc(doc(db, 'users', studentId));

    return {
      success: true,
      message: 'Student account and all related data deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting student account:', error);
    throw error;
  }
};

const authService = {
  // Phase A exports
  validateSchoolId,
  createStudentAccount,
  activateStudentAccount,
  loginWithSchoolId,
  loginWithEmail,
  sendPasswordReset,
  logout,
  getCurrentUser,
  onAuthStateChange,

  // Phase B exports
  checkPermission,
  canUploadVideo,
  canAccessAdminPanel,
  canEvaluateVideo,
  getAssignedVideosForJudge,
  getEvaluationWeight,

  // Student management exports
  updateStudentAccount,
  deleteStudentAccount
};

export default authService;
