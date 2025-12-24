/**
 * Script to upload sample notifications to Firebase Firestore
 * Run this to see how notifications work in the app
 *
 * Usage: node scripts/uploadSampleNotifications.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
const serviceAccount = require('../scienceverse-competition-firebase-adminsdk.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Helper to create timestamps for "X hours/days ago"
const getTimestamp = (hoursAgo) => {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date;
};

// Sample notifications for different user types (using actual user IDs from your database)
const sampleNotifications = [
  // For student: student1 (kdKPE9Id8YNTFkLq9ruksz5T9z53)
  {
    userId: 'kdKPE9Id8YNTFkLq9ruksz5T9z53',
    title: 'Video Approved!',
    message: 'Your video "How to Make a Volcano" has been approved and is now live.',
    icon: '✅',
    type: 'approval',
    read: false,
    createdAt: getTimestamp(2)
  },
  {
    userId: 'kdKPE9Id8YNTFkLq9ruksz5T9z53',
    title: 'New Evaluation Received',
    message: 'Dr. Anjali Mehta rated your video 4.5 stars. Great work!',
    icon: '⭐',
    type: 'evaluation',
    read: false,
    createdAt: getTimestamp(5)
  },
  {
    userId: 'kdKPE9Id8YNTFkLq9ruksz5T9z53',
    title: 'Badge Earned!',
    message: 'Congratulations! You earned the "First Steps" badge for uploading your first video.',
    icon: '🏆',
    type: 'badge',
    read: true,
    createdAt: getTimestamp(24)
  },
  {
    userId: 'kdKPE9Id8YNTFkLq9ruksz5T9z53',
    title: 'Competition Reminder',
    message: 'Only 15 days left to submit your videos. Keep up the great work!',
    icon: '⏰',
    type: 'reminder',
    read: true,
    createdAt: getTimestamp(48)
  },

  // For teacher: Sree (9bMFipoeBxYA5I6yhVNtoSMl9jd2)
  {
    userId: '9bMFipoeBxYA5I6yhVNtoSMl9jd2',
    title: 'New Video Pending Approval',
    message: 'student1 submitted a new video for review.',
    icon: '📹',
    type: 'pending_approval',
    read: false,
    createdAt: getTimestamp(1)
  },
  {
    userId: '9bMFipoeBxYA5I6yhVNtoSMl9jd2',
    title: 'Student Achievement',
    message: 'Your student earned the "Quality Star" badge!',
    icon: '🌟',
    type: 'student_achievement',
    read: false,
    createdAt: getTimestamp(12)
  },
  {
    userId: '9bMFipoeBxYA5I6yhVNtoSMl9jd2',
    title: 'Evaluation Completed',
    message: 'You successfully evaluated 5 videos this week. Keep it up!',
    icon: '✓',
    type: 'milestone',
    read: true,
    createdAt: getTimestamp(72)
  },

  // For judge: Valli (psrvjW8jhnSkuyMqYx05ecIZPzA2)
  {
    userId: 'psrvjW8jhnSkuyMqYx05ecIZPzA2',
    title: 'New Videos Assigned',
    message: 'You have 3 new videos assigned for evaluation.',
    icon: '📋',
    type: 'assignment',
    read: false,
    createdAt: getTimestamp(3)
  },
  {
    userId: 'psrvjW8jhnSkuyMqYx05ecIZPzA2',
    title: 'Evaluation Deadline',
    message: 'Reminder: Complete assigned evaluations by March 25th.',
    icon: '⚠️',
    type: 'deadline',
    read: false,
    createdAt: getTimestamp(8)
  },

  // For admin: System Administrator (SmRBMeSD2pbhX1kY8DJMynrt6eC3)
  {
    userId: 'SmRBMeSD2pbhX1kY8DJMynrt6eC3',
    title: 'System Update',
    message: 'New features added: Video thumbnails and improved discovery feed.',
    icon: '📢',
    type: 'announcement',
    read: false,
    createdAt: getTimestamp(4)
  },
  {
    userId: 'SmRBMeSD2pbhX1kY8DJMynrt6eC3',
    title: 'Platform Statistics',
    message: 'Great progress! 5 videos uploaded and 12 evaluations completed.',
    icon: '📊',
    type: 'stats',
    read: true,
    createdAt: getTimestamp(96)
  }
];

async function uploadSampleNotifications() {
  console.log('🔔 Starting sample notifications upload to Firebase...\n');

  try {
    // Get current users to verify IDs exist
    console.log('📋 Checking for existing users...');
    const usersSnapshot = await db.collection('users').get();
    const existingUsers = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      name: doc.data().name,
      role: doc.data().role
    }));

    if (existingUsers.length === 0) {
      console.log('\n⚠️  Warning: No users found in database.');
      console.log('   Notifications will be created with placeholder user IDs.');
      console.log('   You can manually update the userId field in Firebase Console.\n');
    } else {
      console.log(`✓ Found ${existingUsers.length} users in database\n`);
      console.log('Available users:');
      existingUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.role}): ${user.uid}`);
      });
      console.log('\n');
    }

    // Upload Notifications
    console.log('🔔 Uploading sample notifications...');
    const batch = db.batch();
    let count = 0;

    for (const notification of sampleNotifications) {
      const notificationRef = db.collection('notifications').doc();
      const notificationData = {
        ...notification,
        createdAt: Timestamp.fromDate(notification.createdAt)
      };
      batch.set(notificationRef, notificationData);
      count++;

      const status = notification.read ? '📖' : '📩';
      console.log(`  ${status} ${notification.icon} ${notification.title} (for user: ${notification.userId})`);
    }

    await batch.commit();
    console.log(`\n✅ Successfully uploaded ${count} notifications!\n`);

    console.log('📝 Next Steps:');
    console.log('   1. If using real user accounts:');
    console.log('      - Go to Firebase Console → Firestore → notifications collection');
    console.log('      - Update the "userId" field to match your actual user UIDs');
    console.log('   2. If testing with mock user IDs:');
    console.log('      - Create users with IDs: student001, teacher001, judge001, admin001');
    console.log('      - Or use existing user UIDs from the list above');
    console.log('\n   3. Refresh your app to see notifications!');
    console.log('      - Login with the user account');
    console.log('      - Click the notification bell (top right)');
    console.log('      - Unread notifications will show a badge\n');

    console.log('🎉 Sample notifications ready!');

  } catch (error) {
    console.error('❌ Error uploading sample notifications:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the upload
uploadSampleNotifications();
