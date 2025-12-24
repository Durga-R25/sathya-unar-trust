const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Cloud Function to create user accounts without auto-login
 * Only callable by admin users
 */
exports.createUserAccount = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Get authorization token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: { message: 'No authorization token provided' } });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const callerUid = decodedToken.uid;

    // Get the data from request body
    const data = req.body.data || req.body;
    // Get the calling user's document to verify admin role
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();

    if (!callerDoc.exists) {
      res.status(403).json({ error: { message: 'User document not found' } });
      return;
    }

    const callerData = callerDoc.data();
    const callerRole = callerData.role ? callerData.role.toLowerCase() : '';

    // Verify caller is admin
    if (callerRole !== 'admin') {
      res.status(403).json({ error: { message: 'Only administrators can create user accounts' } });
      return;
    }

    // Validate input data
    const { email, password, name, role, schoolName, district, state, organization, expertise, village, designation } = data;

    if (!email || !password || !name || !role) {
      res.status(400).json({ error: { message: 'Missing required fields: email, password, name, or role' } });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: { message: 'Password must be at least 6 characters' } });
      return;
    }

    if (role === 'teacher' && !schoolName) {
      res.status(400).json({ error: { message: 'School name is required for teachers' } });
      return;
    }

    if (role === 'judge' && !organization) {
      res.status(400).json({ error: { message: 'Organization is required for judges' } });
      return;
    }
    // Create user in Firebase Auth (does NOT auto-login because this is server-side)
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    // Prepare user data for Firestore
    const userData = {
      uid: userRecord.uid,
      email: email,
      name: name,
      role: role,
      district: district || '',
      state: state || '',
      village: village || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: callerUid
    };

    // Add role-specific fields
    if (role === 'teacher') {
      userData.schoolName = schoolName;
      userData.designation = designation || '';
    } else if (role === 'judge') {
      userData.organization = organization;
      userData.expertise = expertise || '';
    }

    // Create user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set(userData);

    // Return success
    res.status(200).json({
      result: {
        success: true,
        uid: userRecord.uid,
        email: email,
        name: name,
        role: role
      }
    });

  } catch (error) {
    console.error('Error in createUserAccount:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-exists') {
      res.status(400).json({ error: { message: 'Email already in use' } });
    } else if (error.code === 'auth/invalid-email') {
      res.status(400).json({ error: { message: 'Invalid email format' } });
    } else if (error.code === 'auth/weak-password') {
      res.status(400).json({ error: { message: 'Password is too weak' } });
    } else {
      res.status(500).json({ error: { message: 'Failed to create user account: ' + error.message } });
    }
  }
});
