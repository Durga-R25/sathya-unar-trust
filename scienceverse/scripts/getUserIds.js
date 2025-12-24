/**
 * Helper script to get user IDs from Firebase
 * This will help us create notifications for real users
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../scienceverse-competition-firebase-adminsdk.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function getUserIds() {
  console.log('👥 Fetching user IDs from Firebase...\n');

  try {
    const usersSnapshot = await db.collection('users').get();

    if (usersSnapshot.empty) {
      console.log('⚠️  No users found in database.');
      console.log('\nTo create test users, please:');
      console.log('1. Login to your app');
      console.log('2. Create accounts for different roles (student, teacher, judge, admin)');
      console.log('3. Run this script again\n');
      return;
    }

    console.log(`✅ Found ${usersSnapshot.size} users:\n`);

    const usersByRole = {
      student: [],
      teacher: [],
      judge: [],
      admin: []
    };

    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const user = {
        uid: doc.id,
        name: data.name || 'Unknown',
        email: data.email || 'No email',
        role: (data.role || 'unknown').toLowerCase()
      };

      if (usersByRole[user.role]) {
        usersByRole[user.role].push(user);
      }
    });

    // Display users by role
    Object.keys(usersByRole).forEach(role => {
      if (usersByRole[role].length > 0) {
        console.log(`${getRoleIcon(role)} ${role.toUpperCase()}S (${usersByRole[role].length}):`);
        usersByRole[role].forEach(user => {
          console.log(`   ${user.name}`);
          console.log(`   UID: ${user.uid}`);
          console.log(`   Email: ${user.email}\n`);
        });
      }
    });

    console.log('💡 Use these UIDs in uploadSampleNotifications.js');
    console.log('   Replace the placeholder IDs (student001, teacher001, etc.)');
    console.log('   with actual UIDs from above.\n');

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    process.exit(1);
  }

  process.exit(0);
}

function getRoleIcon(role) {
  const icons = {
    student: '🎓',
    teacher: '👨‍🏫',
    judge: '⚖️',
    admin: '⚙️'
  };
  return icons[role] || '👤';
}

getUserIds();
