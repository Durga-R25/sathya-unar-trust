import React from 'react';
import './DataExport.css';

const DataExport = ({ videos, evaluations }) => {
  const handleExportVideos = () => {
    const csv = convertToCSV(videos);
    downloadCSV(csv, 'videos_export.csv');
  };

  const handleExportEvaluations = () => {
    const allEvals = Object.values(evaluations).flat();
    const csv = convertToCSV(allEvals);
    downloadCSV(csv, 'evaluations_export.csv');
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj =>
      Object.values(obj).map(val =>
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="data-export">
      <h3 className="export-title">📥 Data Export</h3>

      <div className="export-options">
        <div className="export-card">
          <div className="export-icon">📹</div>
          <h4 className="export-card-title">Export Videos</h4>
          <p className="export-card-description">
            Download all video metadata as CSV including titles, descriptions, scores, and uploader details.
          </p>
          <button onClick={handleExportVideos} className="export-button">
            Download Videos CSV
          </button>
        </div>

        <div className="export-card">
          <div className="export-icon">⭐</div>
          <h4 className="export-card-title">Export Evaluations</h4>
          <p className="export-card-description">
            Download all evaluations including scores, comments, evaluator details, and timestamps.
          </p>
          <button onClick={handleExportEvaluations} className="export-button">
            Download Evaluations CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataExport;
