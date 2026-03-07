import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../config/firebase';
import './BadgesAchievements.css';

const BADGE_DEFINITIONS = {
  // Upload Milestones
  firstVideo: {
    id: 'firstVideo', name: 'First Steps', icon: '🎬',
    description: 'Uploaded your first video', category: 'upload', requirement: 1
  },
  videoMaker5: {
    id: 'videoMaker5', name: 'Video Creator', icon: '🎥',
    description: 'Uploaded 5 videos', category: 'upload', requirement: 5
  },
  videoMaker10: {
    id: 'videoMaker10', name: 'Content Producer', icon: '🎞️',
    description: 'Uploaded 10 videos', category: 'upload', requirement: 10
  },
  videoMaker25: {
    id: 'videoMaker25', name: 'Science Broadcaster', icon: '📡',
    description: 'Uploaded 25 videos', category: 'upload', requirement: 25
  },

  // Quality Badges
  highRated: {
    id: 'highRated', name: 'Quality Star', icon: '⭐',
    description: 'Video rated 4+ stars', category: 'quality'
  },
  perfectScore: {
    id: 'perfectScore', name: 'Perfect Score', icon: '💯',
    description: 'Received a perfect 5.0 rating', category: 'quality'
  },
  trendingVideo: {
    id: 'trendingVideo', name: 'Trending', icon: '🔥',
    description: 'Video with 50+ evaluations', category: 'quality'
  },

  // Category Expert
  categoryExpert: {
    id: 'categoryExpert', name: 'Category Expert', icon: '🎓',
    description: 'Uploaded in 5 different categories', category: 'diversity'
  },
  allCategories: {
    id: 'allCategories', name: 'Science Master', icon: '🔬',
    description: 'Uploaded in all categories', category: 'diversity'
  },

  // School Pride
  schoolChampion: {
    id: 'schoolChampion', name: 'School Champion', icon: '🏫',
    description: 'Top video contributor in your school', category: 'school'
  },
  schoolLeader: {
    id: 'schoolLeader', name: 'School Leader', icon: '👑',
    description: 'School ranked in top 3', category: 'school'
  },

  // Teacher Badges
  firstStudent: {
    id: 'firstStudent', name: 'First Mentor', icon: '🌱',
    description: 'Registered your first student', category: 'teaching'
  },
  mentorTeacher: {
    id: 'mentorTeacher', name: 'Mentor Teacher', icon: '👨‍🏫',
    description: 'Registered 5 students', category: 'teaching'
  },
  inspiringTeacher: {
    id: 'inspiringTeacher', name: 'Inspiring Educator', icon: '✨',
    description: 'Registered 10 students', category: 'teaching'
  },

  // Early Adopter
  earlyBird: {
    id: 'earlyBird', name: 'Early Bird', icon: '🐦',
    description: 'First to upload in a category', category: 'special'
  },
  pioneer: {
    id: 'pioneer', name: 'Pioneer', icon: '🚀',
    description: 'Among first 10 users to upload', category: 'special'
  },

  // Collaboration
  teamPlayer: {
    id: 'teamPlayer', name: 'Team Player', icon: '🤝',
    description: 'Collaborated on group project', category: 'collaboration'
  }
};

const BadgesAchievements = ({ currentUser }) => {
  const [userBadges, setUserBadges] = useState([]);
  const [schoolStats, setSchoolStats] = useState(null);
  const [schoolVideos, setSchoolVideos] = useState([]);
  const [showSchoolVideos, setShowSchoolVideos] = useState(false);
  const schoolVideosRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-badges');
  const [leaderboard, setLeaderboard] = useState({ students: [], schools: [], teachers: [] });

  useEffect(() => {
    loadBadgesAndStats();
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBadgesAndStats = async () => {
    try {
      setIsLoading(true);
      const userRole = (currentUser.role || '').toLowerCase();

      // --- Videos for badge calculation ---
      // For students: videos where uploaderId == uid
      // For teachers/admins: videos they uploaded on behalf of students (uploadedBy == uid)
      //   PLUS their own direct uploads
      const uploaderIdSnap = await getDocs(
        query(collection(db, 'videos'), where('uploaderId', '==', currentUser.uid))
      );
      let userVideos = uploaderIdSnap.docs.map(d => d.data());

      if (userRole === 'teacher' || userRole === 'admin') {
        const uploadedBySnap = await getDocs(
          query(collection(db, 'videos'), where('uploadedBy', '==', currentUser.uid))
        );
        // Merge, deduplicating by videoId
        const seenIds = new Set(userVideos.map(v => v.videoId));
        uploadedBySnap.docs.forEach(d => {
          const v = d.data();
          if (!seenIds.has(v.videoId)) {
            userVideos.push(v);
            seenIds.add(v.videoId);
          }
        });
      }

      // --- Category count ---
      let totalCategories = 8;
      try {
        const catsSnap = await getCountFromServer(collection(db, 'categories'));
        totalCategories = catsSnap.data().count || 8;
      } catch (e) { /* use fallback */ }

      // --- Students mentored (teachers/admins) ---
      let studentsMentored = 0;
      if (userRole === 'teacher' || userRole === 'admin') {
        try {
          const studentsSnap = await getCountFromServer(
            query(collection(db, 'users'),
              where('createdBy', '==', currentUser.uid),
              where('role', '==', 'student'))
          );
          studentsMentored = studentsSnap.data().count || 0;
        } catch (e) { /* leave 0 */ }
      }

      // --- School stats + champion check ---
      let isSchoolChampion = false;
      let schoolVideoList = [];
      if (currentUser.schoolName) {
        const schoolSnap = await getDocs(
          query(collection(db, 'videos'), where('uploaderSchool', '==', currentUser.schoolName))
        );
        schoolVideoList = schoolSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(v => v.status === 'active');

        // Count videos per uploader in this school
        const countMap = {};
        schoolVideoList.forEach(v => {
          countMap[v.uploaderId] = (countMap[v.uploaderId] || 0) + 1;
        });
        const myCount = countMap[currentUser.uid] || 0;
        const maxCount = Math.max(...Object.values(countMap), 0);
        if (myCount > 0 && myCount >= maxCount) isSchoolChampion = true;

        setSchoolVideos(schoolVideoList);
        setSchoolStats({ totalVideos: schoolVideoList.length, schoolName: currentUser.schoolName });
      }

      // --- Leaderboard data (all active videos) ---
      const allActiveSnap = await getDocs(
        query(collection(db, 'videos'), where('status', '==', 'active'))
      );
      const allActive = allActiveSnap.docs.map(d => d.data());

      // Top students by video count
      const studentMap = {};
      allActive.forEach(v => {
        if (!v.uploaderId) return;
        if (!studentMap[v.uploaderId]) {
          studentMap[v.uploaderId] = {
            name: v.uploaderName || 'Unknown',
            school: v.uploaderSchool || '',
            count: 0,
            totalScore: 0
          };
        }
        studentMap[v.uploaderId].count++;
        studentMap[v.uploaderId].totalScore += v.aggregateScore || 0;
      });
      const topStudents = Object.values(studentMap)
        .sort((a, b) => b.count - a.count || b.totalScore - a.totalScore)
        .slice(0, 10);

      // Top schools by active video count
      const schoolMap = {};
      allActive.forEach(v => {
        const s = v.uploaderSchool || 'Unknown';
        schoolMap[s] = (schoolMap[s] || 0) + 1;
      });
      const topSchools = Object.entries(schoolMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top teachers by students they registered
      const teacherSnap = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'student'))
      );
      const teacherStudentMap = {};
      teacherSnap.docs.forEach(d => {
        const data = d.data();
        const tid = data.createdBy;
        if (!tid) return;
        if (!teacherStudentMap[tid]) {
          teacherStudentMap[tid] = { uid: tid, name: null, count: 0 };
        }
        teacherStudentMap[tid].count++;
      });

      // Fetch teacher names from users collection
      const teacherUids = Object.keys(teacherStudentMap);
      if (teacherUids.length > 0) {
        const teacherUsersSnap = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'teacher'))
        );
        teacherUsersSnap.docs.forEach(d => {
          const data = d.data();
          if (teacherStudentMap[d.id]) {
            teacherStudentMap[d.id].name = data.name || 'Teacher';
          }
        });
      }

      const topTeachers = Object.values(teacherStudentMap)
        .map(t => ({ ...t, name: t.name || 'Teacher' }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setLeaderboard({ students: topStudents, schools: topSchools, teachers: topTeachers });

      // --- Calculate badges ---
      const earnedBadges = calculateBadges(
        userVideos, currentUser, studentsMentored, totalCategories, isSchoolChampion
      );
      setUserBadges(earnedBadges);

    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBadges = (videos, user, studentsMentored = 0, totalCategories = 8, isSchoolChampion = false) => {
    const badges = [];
    const videoCount = videos.length;
    const userRole = (user.role || '').toLowerCase();

    // Upload milestones
    if (videoCount >= 1)  badges.push(BADGE_DEFINITIONS.firstVideo);
    if (videoCount >= 5)  badges.push(BADGE_DEFINITIONS.videoMaker5);
    if (videoCount >= 10) badges.push(BADGE_DEFINITIONS.videoMaker10);
    if (videoCount >= 25) badges.push(BADGE_DEFINITIONS.videoMaker25);

    // Quality badges
    if (videos.some(v => (v.aggregateScore || 0) >= 4))      badges.push(BADGE_DEFINITIONS.highRated);
    if (videos.some(v => (v.aggregateScore || 0) >= 5))      badges.push(BADGE_DEFINITIONS.perfectScore);
    if (videos.some(v => (v.totalEvaluations || 0) >= 50))   badges.push(BADGE_DEFINITIONS.trendingVideo);

    // Category diversity
    const uniqueCategories = new Set(videos.map(v => v.category).filter(Boolean));
    if (uniqueCategories.size >= 5) badges.push(BADGE_DEFINITIONS.categoryExpert);
    if (totalCategories > 0 && uniqueCategories.size >= totalCategories) {
      badges.push(BADGE_DEFINITIONS.allCategories);
    }

    // School champion
    if (isSchoolChampion) badges.push(BADGE_DEFINITIONS.schoolChampion);

    // Teacher mentor badges (lowered thresholds: 1 / 5 / 10)
    if (userRole === 'teacher' || userRole === 'admin') {
      if (studentsMentored >= 1)  badges.push(BADGE_DEFINITIONS.firstStudent);
      if (studentsMentored >= 5)  badges.push(BADGE_DEFINITIONS.mentorTeacher);
      if (studentsMentored >= 10) badges.push(BADGE_DEFINITIONS.inspiringTeacher);
    }

    return badges;
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

  const medal = (rank) => rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}.`;

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
          <div
            className="stat-card"
            onClick={() => {
              const next = !showSchoolVideos;
              setShowSchoolVideos(next);
              if (next) setTimeout(() => schoolVideosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            }}
            style={{ cursor: 'pointer', border: showSchoolVideos ? '2px solid #6366f1' : undefined }}
            title="Click to view school videos"
          >
            <div className="stat-icon">🏫</div>
            <div className="stat-content">
              <div className="stat-value">{schoolStats.totalVideos}</div>
              <div className="stat-label">School Videos {showSchoolVideos ? '▲' : '▼'}</div>
            </div>
          </div>
        )}
      </div>

      {/* School Videos Expandable List */}
      {showSchoolVideos && schoolStats && (
        <div ref={schoolVideosRef} style={{
          background: '#f8fafc', borderRadius: '12px', padding: '16px',
          marginBottom: '16px', border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '15px' }}>
            🏫 {schoolStats.schoolName} — Active Videos
          </h4>
          {schoolVideos.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
              No active videos from your school yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {schoolVideos.map(video => (
                <div key={video.id} style={{
                  background: 'white', borderRadius: '8px', padding: '12px',
                  border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{video.title}</div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>{video.uploaderName} · {video.category}</div>
                  </div>
                  <div style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: 700
                  }}>
                    ⭐ {(video.aggregateScore || 0).toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="badges-tabs">
        <button className={`tab-btn ${activeTab === 'my-badges' ? 'active' : ''}`} onClick={() => setActiveTab('my-badges')}>My Badges</button>
        <button className={`tab-btn ${activeTab === 'all-badges' ? 'active' : ''}`} onClick={() => setActiveTab('all-badges')}>All Badges</button>
        <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>Leaderboard</button>
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

            {/* Top Students */}
            <div className="leaderboard-card">
              <h3>🎓 Top Students</h3>
              {leaderboard.students.length === 0 ? (
                <p className="leaderboard-empty">No student uploads yet.</p>
              ) : (
                <div className="leaderboard-list">
                  {leaderboard.students.map((s, i) => (
                    <div key={i} className={`leaderboard-row ${currentUser.role === 'student' && s.name === currentUser.name ? 'leaderboard-row--me' : ''}`}>
                      <span className="leaderboard-rank">{medal(i)}</span>
                      <div className="leaderboard-info">
                        <span className="leaderboard-name">{s.name}</span>
                        <span className="leaderboard-sub">{s.school}</span>
                      </div>
                      <span className="leaderboard-score">{s.count} video{s.count !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Schools */}
            <div className="leaderboard-card">
              <h3>🏫 Top Schools</h3>
              {leaderboard.schools.length === 0 ? (
                <p className="leaderboard-empty">No school data yet.</p>
              ) : (
                <div className="leaderboard-list">
                  {leaderboard.schools.map((s, i) => (
                    <div key={i} className={`leaderboard-row ${s.name === currentUser.schoolName ? 'leaderboard-row--me' : ''}`}>
                      <span className="leaderboard-rank">{medal(i)}</span>
                      <div className="leaderboard-info">
                        <span className="leaderboard-name">{s.name}</span>
                      </div>
                      <span className="leaderboard-score">{s.count} video{s.count !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Teachers */}
            <div className="leaderboard-card">
              <h3>👨‍🏫 Top Teachers</h3>
              {leaderboard.teachers.length === 0 ? (
                <p className="leaderboard-empty">No teacher data yet.</p>
              ) : (
                <div className="leaderboard-list">
                  {leaderboard.teachers.map((t, i) => (
                    <div key={i} className="leaderboard-row">
                      <span className="leaderboard-rank">{medal(i)}</span>
                      <div className="leaderboard-info">
                        <span className="leaderboard-name">{t.name}</span>
                      </div>
                      <span className="leaderboard-score">{t.count} student{t.count !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default BadgesAchievements;
