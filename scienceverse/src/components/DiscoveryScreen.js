import React, { useState, useMemo, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
import VideoGrid from './VideoGrid';
import Leaderboard from './Leaderboard';
import './DiscoveryScreen.css';

/**
 * DiscoveryScreen Component
 * Search, filter, and discover videos with leaderboards
 */
const DiscoveryScreen = ({ onVideoSelect, onClose }) => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('videos'); // videos, leaderboard, trending
  const [filters, setFilters] = useState({
    category: '',
    school: '',
    district: '',
    minRating: 0,
    sortBy: 'newest' // newest, oldest, highest-rated, most-evaluated
  });
  const [showFilters, setShowFilters] = useState(false);

  // Load videos from Firestore
  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      const videosQuery = query(
        collection(db, 'videos'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(videosQuery);
      const videosList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }));
      setVideos(videosList);
    } catch (error) {
      console.error('Error loading videos:', error);
      alert('Failed to load videos: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Search and filter logic
  const filteredVideos = useMemo(() => {
    let results = [...videos];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(video =>
        video.title.toLowerCase().includes(query) ||
        video.description.toLowerCase().includes(query) ||
        video.uploaderName.toLowerCase().includes(query) ||
        video.tags.some(tag => tag.toLowerCase().includes(query)) ||
        video.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.category) {
      results = results.filter(video => video.category === filters.category);
    }

    // School filter
    if (filters.school) {
      results = results.filter(video => video.schoolName === filters.school);
    }

    // District filter
    if (filters.district) {
      results = results.filter(video => video.district === filters.district);
    }

    // Minimum rating filter
    if (filters.minRating > 0) {
      results = results.filter(video => video.aggregateScore >= filters.minRating);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'newest':
        results.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        break;
      case 'oldest':
        results.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
        break;
      case 'highest-rated':
        results.sort((a, b) => b.aggregateScore - a.aggregateScore);
        break;
      case 'most-evaluated':
        results.sort((a, b) => b.totalEvaluations - a.totalEvaluations);
        break;
      default:
        break;
    }

    return results;
  }, [videos, searchQuery, filters]);

  // Trending videos (most evaluated in last 24h - simplified for demo)
  const trendingVideos = useMemo(() => {
    return [...videos]
      .sort((a, b) => b.totalEvaluations - a.totalEvaluations)
      .slice(0, 10);
  }, [videos]);

  // School leaderboard
  const schoolLeaderboard = useMemo(() => {
    const schoolMap = {};

    videos.forEach(video => {
      if (!schoolMap[video.schoolId]) {
        schoolMap[video.schoolId] = {
          schoolId: video.schoolId,
          schoolName: video.schoolName,
          district: video.district,
          videoCount: 0,
          totalScore: 0,
          totalEvaluations: 0,
          totalViews: 0
        };
      }

      const school = schoolMap[video.schoolId];
      school.videoCount++;
      school.totalScore += video.aggregateScore;
      school.totalEvaluations += video.totalEvaluations;
      school.totalViews += video.views;
    });

    return Object.values(schoolMap)
      .map(school => ({
        ...school,
        averageScore: school.totalScore / school.videoCount
      }))
      .sort((a, b) => b.averageScore - a.averageScore);
  }, [videos]);

  // Category leaderboard
  const categoryStats = useMemo(() => {
    const categoryMap = {};

    videos.forEach(video => {
      if (!categoryMap[video.category]) {
        categoryMap[video.category] = {
          category: video.category,
          videoCount: 0,
          totalScore: 0,
          totalEvaluations: 0
        };
      }

      const cat = categoryMap[video.category];
      cat.videoCount++;
      cat.totalScore += video.aggregateScore;
      cat.totalEvaluations += video.totalEvaluations;
    });

    return Object.values(categoryMap)
      .map(cat => ({
        ...cat,
        averageScore: cat.totalScore / cat.videoCount
      }))
      .sort((a, b) => b.averageScore - a.averageScore);
  }, [videos]);

  // Get unique values for filters
  const categories = [...new Set(videos.map(v => v.category))];
  const schools = [...new Set(videos.map(v => v.schoolName))];
  const districts = [...new Set(videos.map(v => v.district))];

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      school: '',
      district: '',
      minRating: 0,
      sortBy: 'newest'
    });
    setSearchQuery('');
  };

  const activeFiltersCount = [
    filters.category,
    filters.school,
    filters.district,
    filters.minRating > 0,
    searchQuery.trim()
  ].filter(Boolean).length;

  return (
    <div className="discovery-screen-overlay">
      <div className="discovery-screen">
        {/* Header */}
        <div className="discovery-header">
          <h2 className="discovery-title">Discover</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* Search Bar */}
        <div className="discovery-search-section">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search videos, students, or tags..."
          />
          <button
            className={`filter-toggle-button ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍 Filters
            {activeFiltersCount > 0 && (
              <span className="filter-badge">{activeFiltersCount}</span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            categories={categories}
            schools={schools}
            districts={districts}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        )}

        {/* Tabs */}
        <div className="discovery-tabs">
          <button
            className={`tab-button ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            📹 Videos ({filteredVideos.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => setActiveTab('trending')}
          >
            🔥 Trending
          </button>
          <button
            className={`tab-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* Content */}
        <div className="discovery-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading videos...</p>
            </div>
          ) : activeTab === 'videos' ? (
            <VideoGrid
              videos={filteredVideos}
              onVideoSelect={onVideoSelect}
              emptyMessage={
                searchQuery || activeFiltersCount > 0
                  ? 'No videos found. Try different filters.'
                  : 'No videos available yet.'
              }
            />
          ) : null}

          {activeTab === 'trending' && (
            <VideoGrid
              videos={trendingVideos}
              onVideoSelect={onVideoSelect}
              title="🔥 Trending Now"
              subtitle="Most evaluated videos"
              emptyMessage="No trending videos yet."
            />
          )}

          {activeTab === 'leaderboard' && (
            <div className="leaderboard-section">
              <Leaderboard
                title="🏫 School Rankings"
                data={schoolLeaderboard}
                type="school"
              />
              <Leaderboard
                title="📚 Category Rankings"
                data={categoryStats}
                type="category"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoveryScreen;
