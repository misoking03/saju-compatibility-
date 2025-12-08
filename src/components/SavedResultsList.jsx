import React, { useState, useEffect } from 'react';
import './SavedResultsList.css';

const SavedResultsList = ({ onLoadResult, onBack }) => {
  const [savedResults, setSavedResults] = useState([]);

  useEffect(() => {
    // 로컬 스토리지에서 저장된 결과 불러오기
    const saved = localStorage.getItem('sajuResults');
    if (saved) {
      try {
        const results = JSON.parse(saved);
        // 날짜순으로 정렬 (최신순)
        const sortedResults = results.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
        setSavedResults(sortedResults);
      } catch (error) {
        console.error('저장된 결과 불러오기 실패:', error);
      }
    }
  }, []);

  const handleLoad = (result) => {
    onLoadResult(result.friends);
  };

  const handleDelete = (id) => {
    if (window.confirm('이 결과를 삭제하시겠습니까?')) {
      const updated = savedResults.filter(r => r.id !== id);
      setSavedResults(updated);
      localStorage.setItem('sajuResults', JSON.stringify(updated));
    }
  };

  return (
    <div className="saved-results-container">
      <div className="saved-results-card">
        <div className="saved-results-header">
          <button onClick={onBack} className="back-button">
            뒤로
          </button>
          <h2>저장된 결과</h2>
        </div>

        {savedResults.length === 0 ? (
          <div className="empty-state">
            <p>저장된 결과가 없습니다.</p>
            <p className="empty-hint">결과 페이지에서 저장 버튼을 눌러 결과를 저장하세요.</p>
          </div>
        ) : (
          <div className="results-list">
            {savedResults.map((result) => (
              <div key={result.id} className="result-item">
                <div className="result-info">
                  <h3>{result.title || `분석 결과 (${result.friends.length}명)`}</h3>
                  <p className="result-date">
                    {new Date(result.savedAt).toLocaleString('ko-KR')}
                  </p>
                  <div className="result-friends">
                    {result.friends.map((friend, index) => (
                      <span key={friend.id || index} className="friend-badge">
                        {friend.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="result-actions">
                  <button
                    onClick={() => handleLoad(result)}
                    className="load-button"
                  >
                    불러오기
                  </button>
                  <button
                    onClick={() => handleDelete(result.id)}
                    className="delete-button"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedResultsList;

