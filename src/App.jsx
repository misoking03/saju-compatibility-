import React, { useState, useEffect } from 'react';
import FriendForm from './components/FriendForm';
import CompatibilityGraph from './components/CompatibilityGraph';
import SavedResultsList from './components/SavedResultsList';
import { decodeFriendsFromUrl } from './utils/shareUtils';
import './App.css';

function App() {
  const [friends, setFriends] = useState([]);
  const [showGraph, setShowGraph] = useState(false);
  const [showSavedList, setShowSavedList] = useState(false);

  // URL에서 공유된 데이터 로드
  useEffect(() => {
    const sharedFriends = decodeFriendsFromUrl();
    if (sharedFriends && sharedFriends.length > 0) {
      setFriends(sharedFriends);
      setShowGraph(true);
      // URL 정리 (선택사항)
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleAddFriend = (friend) => {
    if (friends.length >= 8) {
      alert('최대 8명까지만 추가할 수 있습니다.');
      return;
    }
    setFriends([...friends, friend]);
  };

  const handleRemoveFriend = (friendId) => {
    setFriends(friends.filter(f => f.id !== friendId));
  };

  const handleStartAnalysis = () => {
    if (friends.length < 2) {
      alert('최소 2명 이상의 친구가 필요합니다.');
      return;
    }
    setShowGraph(true);
  };

  const handleBack = () => {
    setShowGraph(false);
  };

  const handleShowSavedList = () => {
    setShowSavedList(true);
  };

  const handleBackFromSavedList = () => {
    setShowSavedList(false);
  };

  const handleLoadResult = (loadedFriends) => {
    setFriends(loadedFriends);
    setShowSavedList(false);
    setShowGraph(true);
  };

  return (
    <div className="App">
      {showSavedList ? (
        <SavedResultsList
          onLoadResult={handleLoadResult}
          onBack={handleBackFromSavedList}
        />
      ) : !showGraph ? (
        <FriendForm
          friends={friends}
          onAddFriend={handleAddFriend}
          onRemoveFriend={handleRemoveFriend}
          onStartAnalysis={handleStartAnalysis}
          onShowSavedList={handleShowSavedList}
        />
      ) : (
        <CompatibilityGraph
          friends={friends}
          onBack={handleBack}
        />
      )}
      {!showGraph && !showSavedList && (
        <div className="bottom-background-image">
          <img src="/images/sajumainkv.jpg" alt="배경 이미지" />
        </div>
      )}
    </div>
  );
}

export default App;

