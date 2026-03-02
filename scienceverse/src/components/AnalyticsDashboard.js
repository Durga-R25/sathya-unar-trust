import React, { useState, useEffect } from 'react';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Load each collection independently — a failure in one won't block the others
        const safeGet = async (col) => {
          try {
            const snap = await getDocs(collection(db, col));
            return snap.docs.map(d => d.data());
          } catch (e) {
            console.error(`Failed to load ${col}:`, e);
            return [];
          }
        };

        const [videos, evals, users] = await Promise.all([
          safeGet('videos'),
          safeGet('evaluations'),
          safeGet('users')
        ]);

        const activeVideos = videos.filter(v => v.status === 'active');
        const pendingVideos = videos.filter(v => v.status === 'pending');

        const schools = [...new Set(
          videos.map(v => v.uploaderSchool || v.schoolName).filter(Boolean)
        )];
        const categories = [...new Set(videos.map(v => v.category).filter(Boolean))];

        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const toDate = (val) => {
          if (!val) return null;
          try {
            const d = val.toDate ? val.toDate() : new Date(val);
            return isNaN(d.getTime()) ? null : d;
          } catch { return null; }
        };

        const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
        const scoredVideos = activeVideos.filter(v => v.aggregateScore > 0);
        const avgScore = scoredVideos.length
          ? (scoredVideos.reduce((sum, v) => sum + (v.aggregateScore || 0), 0) / scoredVideos.length).toFixed(2)
          : '0.00';

        const topCategory = categories.reduce((top, cat) => {
          const count = videos.filter(v => v.category === cat).length;
          return count > (top.count || 0) ? { name: cat, count } : top;
        }, {});

        setStats({
          totalVideos: videos.length,
          activeVideos: activeVideos.length,
          pendingVideos: pendingVideos.length,
          totalEvaluations: evals.length,
          totalViews,
          totalSchools: schools.length,
          totalCategories: categories.length,
          avgScore,
          totalTeachers: users.filter(u => (u.role || '').toLowerCase() === 'teacher').length,
          totalStudents: users.filter(u => (u.role || '').toLowerCase() === 'student').length,
          totalJudges: users.filter(u => (u.role || '').toLowerCase() === 'judge').length,
          videosToday: videos.filter(v => {
            const d = toDate(v.uploadedAt || v.createdAt);
            return d && d > yesterday;
          }).length,
          videosThisWeek: videos.filter(v => {
            const d = toDate(v.uploadedAt || v.createdAt);
            return d && d > weekAgo;
          }).length,
          evaluationsToday: evals.filter(e => {
            const d = toDate(e.createdAt || e.evaluatedAt);
            return d && d > yesterday;
          }).length,
          topCategory
        });
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <h3 className="dashboard-title">📊 Analytics Overview</h3>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="analytics-dashboard">
        <h3 className="dashboard-title">📊 Analytics Overview</h3>
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>
          Failed to load analytics. Please try again.
        </p>
      </div>
    );
  }

  const resetAllViews = async () => {
    if (!window.confirm('Reset ALL video view counts to 0? This cannot be undone.')) return;
    setResetting(true);
    try {
      const snap = await getDocs(collection(db, 'videos'));
      // Firestore batch supports up to 500 operations
      const chunkSize = 499;
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += chunkSize) {
        const batch = writeBatch(db);
        docs.slice(i, i + chunkSize).forEach(d => {
          batch.update(doc(db, 'videos', d.id), { views: 0 });
        });
        await batch.commit();
      }
      alert(`Done — reset views to 0 for ${docs.length} video(s).`);
      // Refresh stats
      setStats(prev => ({ ...prev, totalViews: 0 }));
    } catch (err) {
      console.error('Reset views failed:', err);
      alert('Failed to reset views: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  const statCards = [
    { label: 'Total Videos', value: stats.totalVideos, icon: '📹', color: '#6366f1' },
    { label: 'Active Videos', value: stats.activeVideos, icon: '▶️', color: '#10b981' },
    { label: 'Pending Approval', value: stats.pendingVideos, icon: '⏳', color: '#f59e0b' },
    { label: 'Total Evaluations', value: stats.totalEvaluations, icon: '⭐', color: '#ec4899' },
    { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: '👁️', color: '#3b82f6' },
    { label: 'Avg Score', value: stats.avgScore, icon: '📊', color: '#8b5cf6' },
    { label: 'Schools', value: stats.totalSchools, icon: '🏫', color: '#14b8a6' },
    { label: 'Teachers', value: stats.totalTeachers, icon: '👨‍🏫', color: '#f97316' },
    { label: 'Students', value: stats.totalStudents, icon: '🎓', color: '#06b6d4' },
    { label: 'Judges', value: stats.totalJudges, icon: '⚖️', color: '#a855f7' },
  ];

  return (
    <div className="analytics-dashboard">
      <h3 className="dashboard-title">📊 Analytics Overview</h3>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((stat, idx) => (
          <div key={idx} className="stat-card" style={{ borderColor: stat.color }}>
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20` }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <h4 className="section-title">📈 Recent Activity</h4>
        <div className="activity-cards">
          <div className="activity-card">
            <span className="activity-icon">📹</span>
            <div>
              <div className="activity-value">{stats.videosToday}</div>
              <div className="activity-label">Videos Today</div>
            </div>
          </div>
          <div className="activity-card">
            <span className="activity-icon">📅</span>
            <div>
              <div className="activity-value">{stats.videosThisWeek}</div>
              <div className="activity-label">Videos This Week</div>
            </div>
          </div>
          <div className="activity-card">
            <span className="activity-icon">⭐</span>
            <div>
              <div className="activity-value">{stats.evaluationsToday}</div>
              <div className="activity-label">Evaluations Today</div>
            </div>
          </div>
          <div className="activity-card">
            <span className="activity-icon">🏆</span>
            <div>
              <div className="activity-value">{stats.topCategory.name || 'N/A'}</div>
              <div className="activity-label">
                Top Category{stats.topCategory.count ? ` (${stats.topCategory.count} videos)` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="activity-section">
        <h4 className="section-title">⚙️ Admin Actions</h4>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={resetAllViews}
            disabled={resetting}
            style={{
              padding: '10px 20px',
              background: resetting ? '#475569' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: resetting ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              opacity: resetting ? 0.7 : 1,
            }}
          >
            {resetting ? '⏳ Resetting...' : '🔄 Reset All View Counts to 0'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
