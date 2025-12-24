import React, { useMemo } from 'react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ videos, evaluations }) => {
  const stats = useMemo(() => {
    const allEvaluations = Object.values(evaluations).flat();
    const schools = [...new Set(videos.map(v => v.schoolId))];
    const categories = [...new Set(videos.map(v => v.category))];

    const today = new Date();
    const yesterday = new Date(today - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today - 7 * 24 * 60 * 60 * 1000);

    return {
      totalVideos: videos.length,
      totalEvaluations: allEvaluations.length,
      totalViews: videos.reduce((sum, v) => sum + v.views, 0),
      totalSchools: schools.length,
      totalCategories: categories.length,
      avgScore: (videos.reduce((sum, v) => sum + v.aggregateScore, 0) / videos.length).toFixed(2),
      videosToday: videos.filter(v => new Date(v.uploadedAt) > yesterday).length,
      videosThisWeek: videos.filter(v => new Date(v.uploadedAt) > weekAgo).length,
      evaluationsToday: allEvaluations.filter(e => new Date(e.evaluatedAt) > yesterday).length,
      topCategory: categories.reduce((top, cat) => {
        const count = videos.filter(v => v.category === cat).length;
        return count > (top.count || 0) ? { name: cat, count } : top;
      }, {})
    };
  }, [videos, evaluations]);

  const statCards = [
    { label: 'Total Videos', value: stats.totalVideos, icon: '📹', color: '#6366f1' },
    { label: 'Total Evaluations', value: stats.totalEvaluations, icon: '⭐', color: '#f59e0b' },
    { label: 'Total Views', value: stats.totalViews.toLocaleString(), icon: '👁️', color: '#10b981' },
    { label: 'Participating Schools', value: stats.totalSchools, icon: '🏫', color: '#8b5cf6' },
    { label: 'Average Score', value: stats.avgScore, icon: '📊', color: '#ec4899' },
    { label: 'Categories', value: stats.totalCategories, icon: '📚', color: '#3b82f6' }
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
              <div className="activity-label">Top Category ({stats.topCategory.count} videos)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
