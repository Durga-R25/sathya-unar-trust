import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import './VideoApproval.css';

/**
 * VideoApproval Component
 * Teachers and admins can approve/reject pending student videos
 */
const VideoApproval = ({ currentUser }) => {
  const [pendingVideos, setPendingVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [stats, setStats] = useState({ total: 0, mySchool: 0 });

  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  const isTeacher = currentUser?.role?.toLowerCase() === 'teacher';

  useEffect(() => {
    loadPendingVideos();
  }, []);

  const loadPendingVideos = async () => {
    try {
      setIsLoading(true);

      let videosQuery;
      if (isAdmin) {
        // Admins see all pending videos
        videosQuery = query(
          collection(db, 'videos'),
          where('status', '==', 'pending')
        );
      } else if (isTeacher) {
        // Teachers see pending videos from their school only
        // Use single filter + in-memory filter to avoid composite index requirement
        videosQuery = query(
          collection(db, 'videos'),
          where('status', '==', 'pending')
        );
      }

      const snapshot = await getDocs(videosQuery);
      let allVideos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }));

      // Filter by school in memory for teachers (case-insensitive, trimmed)
      const videos = isTeacher
        ? allVideos.filter(v =>
            v.uploaderSchool?.toLowerCase().trim() === currentUser.schoolName?.toLowerCase().trim()
          )
        : allVideos;

      setPendingVideos(videos);

      const mySchoolCount = isTeacher ? videos.length : 0;

      setStats({
        total: videos.length,
        mySchool: mySchoolCount
      });
    } catch (error) {
      console.error('Error loading pending videos:', error);
      alert('Failed to load pending videos: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (video) => {
    if (!window.confirm(`Approve video "${video.title}" by ${video.uploaderName}?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'videos', video.id), {
        status: 'active',
        approvedBy: currentUser.uid,
        approvedAt: serverTimestamp()
      });

      setPendingVideos(pendingVideos.filter(v => v.id !== video.id));
      alert('Video approved successfully!');
    } catch (error) {
      console.error('Error approving video:', error);
      alert('Failed to approve video: ' + error.message);
    }
  };

  const handleReject = async (video) => {
    const reason = window.prompt('Enter rejection reason (will be sent to student):');
    if (!reason) return;

    if (!window.confirm(`Reject video "${video.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'videos', video.id), {
        status: 'rejected',
        rejectedBy: currentUser.uid,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason
      });

      setPendingVideos(pendingVideos.filter(v => v.id !== video.id));
      alert('Video rejected.');
    } catch (error) {
      console.error('Error rejecting video:', error);
      alert('Failed to reject video: ' + error.message);
    }
  };

  const handleDelete = async (video) => {
    if (!window.confirm(`Delete video "${video.title}"? This will permanently remove it.`)) {
      return;
    }

    const confirmText = window.prompt('Type "DELETE" to confirm:');
    if (confirmText !== 'DELETE') return;

    try {
      await deleteDoc(doc(db, 'videos', video.id));
      setPendingVideos(pendingVideos.filter(v => v.id !== video.id));
      alert('Video deleted successfully');
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="video-approval-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading pending videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="video-approval-container">
      <div className="approval-header">
        <div>
          <h2>Video Approvals</h2>
          <p className="subtitle">Review and approve student video submissions</p>
        </div>
        <button
          className="refresh-button"
          onClick={loadPendingVideos}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="approval-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Pending Approvals</div>
        </div>
        {isTeacher && (
          <div className="stat-card highlight">
            <div className="stat-value">{stats.mySchool}</div>
            <div className="stat-label">From My School</div>
          </div>
        )}
      </div>

      {/* Pending Videos List */}
      {pendingVideos.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">✓</span>
          <h3>All Caught Up!</h3>
          <p>No pending videos to review at this time.</p>
          <p style={{ marginTop: '10px', fontSize: '14px', color: '#64748b' }}>
            {isTeacher
              ? 'Videos from your school will appear here once students upload them.'
              : 'All pending videos from all schools will appear here.'
            }
          </p>
        </div>
      ) : (
        <div className="pending-videos-list">
          {pendingVideos.map((video) => (
            <div key={video.id} className="video-approval-card">
              <div className="video-approval-header">
                <div className="video-info">
                  <h3>{video.title}</h3>
                  <div className="video-meta">
                    <span className="meta-item">📁 {video.category}</span>
                    <span className="meta-item">🎓 {video.uploaderName}</span>
                    <span className="meta-item">🏫 {video.uploaderSchool}</span>
                    <span className="meta-item">📅 {new Date(video.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="status-badge pending">⏳ Pending Review</span>
              </div>

              <div className="video-description">
                <strong>Description:</strong>
                <p>{video.description}</p>
              </div>

              <div className="video-details">
                <div className="detail-row">
                  <span className="label">Class:</span>
                  <span className="value">Class {video.class}</span>
                </div>
                <div className="detail-row">
                  <span className="label">District:</span>
                  <span className="value">{video.district}</span>
                </div>
                <div className="detail-row">
                  <span className="label">School ID:</span>
                  <span className="value code">{video.schoolId}</span>
                </div>
              </div>

              {/* Video Preview */}
              {video.videoUrl && (
                <div className="video-preview">
                  <video
                    controls
                    className="preview-video"
                    src={video.videoUrl}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              )}

              <div className="approval-actions">
                <button
                  className="action-btn approve-btn"
                  onClick={() => handleApprove(video)}
                >
                  ✓ Approve
                </button>
                <button
                  className="action-btn reject-btn"
                  onClick={() => handleReject(video)}
                >
                  ✗ Reject
                </button>
                {isAdmin && (
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(video)}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoApproval;
