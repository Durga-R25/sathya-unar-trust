import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import './BadgesAchievements.css';

/**
 * BadgesAchievements Component
 * Gamification system to motivate schools, teachers, and students
 */

// Define all available badges
const BADGE_DEFINITIONS = {
  // Upload Milestones
  firstVideo: {
    id: 'firstVideo',
    name: 'First Steps',
    icon: '🎬',
    description: 'Uploaded your first video',
    category: 'upload',
    requirement: 1
  },
  videoMaker5: {
    id: 'videoMaker5',
    name: 'Video Creator',
    icon: '🎥',
    description: 'Uploaded 5 videos',
    category: 'upload',
    requirement: 5
  },
  videoMaker10: {
    id: 'videoMaker10',
    name: 'Content Producer',
    icon: '🎞️',
    description: 'Uploaded 10 videos',
    category: 'upload',
    requirement: 10
  },
  videoMaker25: {
    id: 'videoMaker25',
    name: 'Science Broadcaster',
    icon: '📡',
    description: 'Uploaded 25 videos',
    category: 'upload',
    requirement: 25
  },

  // Quality Badges
  highRated: {
    id: 'highRated',
    name: 'Quality Star',
    icon: '⭐',
    description: 'Video rated 4+ stars',
    category: 'quality'
  },
  perfectScore: {
    id: 'perfectScore',
    name: 'Perfect Score',
    icon: '💯',
    description: 'Received a perfect 5.0 rating',
    category: 'quality'
  },
  trendingVideo: {
    id: 'trendingVideo',
    name: 'Trending',
    icon: '🔥',
    description: 'Video with 50+ evaluations',
    category: 'quality'
  },

  // Category Expert
  categoryExpert: {
    id: 'categoryExpert',
    name: 'Category Expert',
    icon: '🎓',
    description: 'Uploaded in 5 different categories',
    category: 'diversity'
  },
  allCategories: {
    id: 'allCategories',
    name: 'Science Master',
    icon: '🔬',
    description: 'Uploaded in all categories',
    category: 'diversity'
  },

  // School Pride
  schoolChampion: {
    id: 'schoolChampion',
    name: 'School Champion',
    icon: '🏫',
    description: 'Top contributor in your school',
    category: 'school'
  },
  schoolLeader: {
    id: 'schoolLeader',
    name: 'School Leader',
    icon: '👑',
    description: 'School ranked in top 10',
    category: 'school'
  },

  // Teacher Badges
  mentorTeacher: {
    id: 'mentorTeacher',
    name: 'Mentor Teacher',
    icon: '👨‍🏫',
    description: 'Helped 10 students upload videos',
    category: 'teaching'
  },
  inspiringTeacher: {
    id: 'inspiringTeacher',
    name: 'Inspiring Educator',
    icon: '✨',
    description: 'Helped 25 students upload videos',
    category: 'teaching'
  },

  // Early Adopter
  earlyBird: {
    id: 'earlyBird',
    name: 'Early Bird',
    icon: '🐦',
    description: 'First to upload in a category',
    category: 'special'
  },
  pioneer: {
    id: 'pioneer',
    name: 'Pioneer',
    icon: '🚀',
    description: 'Among first 10 users to upload',
    category: 'special'
  },

  // Collaboration
  teamPlayer: {
    id: 'teamPlayer',
    name: 'Team Player',
    icon: '🤝',
    description: 'Collaborated on group project',
    category: 'collaboration'
  }
};

const BadgesAchievements = ({ currentUser }) => {
  const [userBadges, setUserBadges] = useState([]);
  const [schoolStats, setSchoolStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-badges'); // my-badges, all-badges, leaderboard

  useEffect(() => {
    loadBadgesAndStats();
  }, [currentUser]);

  const loadBadgesAndStats = async () => {
    try {
      setIsLoading(true);

      // Get user's videos
      const videosQuery = query(
        collection(db, 'videos'),
        where('uploaderId', '==', currentUser.uid)
      );
      const videosSnapshot = await getDocs(videosQuery);
      const userVideos = videosSnapshot.docs.map(doc => doc.data());

      // Calculate earned badges
      const earnedBadges = calculateBadges(userVideos, currentUser);
      setUserBadges(earnedBadges);

      // Get school statistics
      if (currentUser.schoolName) {
        const schoolVideosQuery = query(
          collection(db, 'videos'),
          where('uploaderSchool', '==', currentUser.schoolName),
          where('status', '==', 'active')
        );
        const schoolSnapshot = await getDocs(schoolVideosQuery);

        setSchoolStats({
          totalVideos: schoolSnapshot.size,
          schoolName: currentUser.schoolName
        });
      }

    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBadges = (videos, user) => {
    const badges = [];
    const videoCount = videos.length;

    // Upload milestones
    if (videoCount >= 1) badges.push(BADGE_DEFINITIONS.firstVideo);
    if (videoCount >= 5) badges.push(BADGE_DEFINITIONS.videoMaker5);
    if (videoCount >= 10) badges.push(BADGE_DEFINITIONS.videoMaker10);
    if (videoCount >= 25) badges.push(BADGE_DEFINITIONS.videoMaker25);

    // Quality badges
    const highRatedVideos = videos.filter(v => v.aggregateScore >= 4);
    if (highRatedVideos.length > 0) badges.push(BADGE_DEFINITIONS.highRated);

    const perfectVideos = videos.filter(v => v.aggregateScore === 5);
    if (perfectVideos.length > 0) badges.push(BADGE_DEFINITIONS.perfectScore);

    const trendingVideos = videos.filter(v => v.totalEvaluations >= 50);
    if (trendingVideos.length > 0) badges.push(BADGE_DEFINITIONS.trendingVideo);

    // Category diversity
    const uniqueCategories = new Set(videos.map(v => v.category));
    if (uniqueCategories.size >= 5) badges.push(BADGE_DEFINITIONS.categoryExpert);
    if (uniqueCategories.size >= 10) badges.push(BADGE_DEFINITIONS.allCategories);

    // Early adopter (first 10 videos overall)
    const hasEarlyVideo = videos.some(v => {
      const videoNumber = parseInt(v.videoId.split('_')[1]);
      return videoNumber < 10;
    });
    if (hasEarlyVideo) badges.push(BADGE_DEFINITIONS.pioneer);

    return badges;
  };

  const getBadgeProgress = (badge) => {
    if (!badge.requirement) return 100;
    // This would calculate actual progress based on user data
    return 100; // Placeholder
  };

  if (isLoading) {
    return (
      <div className="badges-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading achievements...</p>
        </div>
      </div>
    );
  }

  const allBadges = Object.values(BADGE_DEFINITIONS);
  const earnedBadgeIds = new Set(userBadges.map(b => b.id));

  return (
    <div className="badges-container">
      <div className="badges-header">
        <h2>Achievements & Badges</h2>
        <p className="subtitle">Celebrate your science journey!</p>
      </div>

      {/* Stats Overview */}
      <div className="achievements-stats">
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-value">{userBadges.length}</div>
            <div className="stat-label">Badges Earned</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{Math.round((userBadges.length / allBadges.length) * 100)}%</div>
            <div className="stat-label">Completion</div>
          </div>
        </div>
        {schoolStats && (
          <div className="stat-card">
            <div className="stat-icon">🏫</div>
            <div className="stat-content">
              <div className="stat-value">{schoolStats.totalVideos}</div>
              <div className="stat-label">School Videos</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="badges-tabs">
        <button
          className={`tab-btn ${activeTab === 'my-badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-badges')}
        >
          My Badges
        </button>
        <button
          className={`tab-btn ${activeTab === 'all-badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('all-badges')}
        >
          All Badges
        </button>
        <button
          className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </button>
      </div>

      {/* Content */}
      <div className="badges-content">
        {activeTab === 'my-badges' && (
          <div className="badges-grid">
            {userBadges.length === 0 ? (
              <div className="empty-badges">
                <span className="empty-icon">🎯</span>
                <h3>Start Your Journey!</h3>
                <p>Upload your first video to earn badges and achievements.</p>
              </div>
            ) : (
              userBadges.map(badge => (
                <div key={badge.id} className="badge-card earned">
                  <div className="badge-icon">{badge.icon}</div>
                  <h3 className="badge-name">{badge.name}</h3>
                  <p className="badge-description">{badge.description}</p>
                  <span className="badge-status earned-status">✓ Earned</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'all-badges' && (
          <div className="badges-grid">
            {allBadges.map(badge => {
              const isEarned = earnedBadgeIds.has(badge.id);
              return (
                <div key={badge.id} className={`badge-card ${isEarned ? 'earned' : 'locked'}`}>
                  <div className="badge-icon">{badge.icon}</div>
                  <h3 className="badge-name">{badge.name}</h3>
                  <p className="badge-description">{badge.description}</p>
                  <span className={`badge-status ${isEarned ? 'earned-status' : 'locked-status'}`}>
                    {isEarned ? '✓ Earned' : '🔒 Locked'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="leaderboard-section">
            <div className="leaderboard-card">
              <h3>Top Schools by Videos</h3>
              <p>Coming soon - School rankings based on total uploads and quality</p>
            </div>
            <div className="leaderboard-card">
              <h3>Top Students</h3>
              <p>Coming soon - Student rankings based on badges earned</p>
            </div>
            <div className="leaderboard-card">
              <h3>Top Teachers</h3>
              <p>Coming soon - Teacher rankings based on student mentorship</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgesAchievements;
