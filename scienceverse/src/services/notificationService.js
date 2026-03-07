import { collection, addDoc, query, where, getCountFromServer, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Create a notification document in Firestore for a given user.
 */
export const createNotification = async (userId, { title, message, icon, type }) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      icon,
      type,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

/**
 * Badge thresholds tied to upload count milestones.
 */
const UPLOAD_BADGE_THRESHOLDS = [
  { count: 1,  name: 'First Steps',        icon: '🎬' },
  { count: 5,  name: 'Video Creator',      icon: '🎥' },
  { count: 10, name: 'Content Producer',   icon: '🎞️' },
  { count: 25, name: 'Science Broadcaster', icon: '📡' }
];

/**
 * After a new video is saved, check if the uploader just crossed a badge
 * threshold and send them a badge-earned notification if so.
 */
export const checkAndNotifyUploadBadges = async (studentId) => {
  try {
    const snap = await getCountFromServer(
      query(collection(db, 'videos'), where('uploaderId', '==', studentId))
    );
    const totalVideos = snap.data().count;

    for (const threshold of UPLOAD_BADGE_THRESHOLDS) {
      if (totalVideos === threshold.count) {
        await createNotification(studentId, {
          title: 'Badge Earned!',
          message: `Congratulations! You earned the "${threshold.name}" badge for ${
            threshold.count === 1 ? 'uploading your first video' : `uploading ${threshold.count} videos`
          }!`,
          icon: threshold.icon,
          type: 'badge'
        });
      }
    }
  } catch (error) {
    console.error('Failed to check upload badges:', error);
  }
};
