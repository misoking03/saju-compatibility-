import React, { useState } from 'react';
import './FriendForm.css';

const FriendForm = ({ onAddFriend, friends, onRemoveFriend, onStartAnalysis, onShowSavedList }) => {
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [isLunar, setIsLunar] = useState(false);

  // 생년월일 입력 시 자동으로 연/월/일로 분리
  const handleBirthdateChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 허용
    setBirthdate(value);

    if (value.length === 8) {
      const yearValue = value.substring(0, 4);
      const monthValue = value.substring(4, 6);
      const dayValue = value.substring(6, 8);
      
      setYear(yearValue);
      setMonth(monthValue);
      setDay(dayValue);
    } else if (value.length < 8) {
      // 입력 중일 때는 부분적으로 업데이트
      if (value.length >= 4) {
        setYear(value.substring(0, 4));
      } else {
        setYear('');
      }
      if (value.length >= 6) {
        setMonth(value.substring(4, 6));
      } else {
        setMonth('');
      }
      if (value.length >= 8) {
        setDay(value.substring(6, 8));
      } else {
        setDay('');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 생년월일 필드가 있으면 우선 사용
    let finalYear = year;
    let finalMonth = month;
    let finalDay = day;

    if (birthdate.length === 8) {
      finalYear = birthdate.substring(0, 4);
      finalMonth = birthdate.substring(4, 6);
      finalDay = birthdate.substring(6, 8);
    }
    
    if (!name || !finalYear || !finalMonth || !finalDay) {
      alert('모든 정보를 입력해주세요.');
      return;
    }

    const yearNum = parseInt(finalYear);
    const monthNum = parseInt(finalMonth);
    const dayNum = parseInt(finalDay);

    if (yearNum < 1900 || yearNum > 2100) {
      alert('연도는 1900년부터 2100년 사이여야 합니다.');
      return;
    }

    if (monthNum < 1 || monthNum > 12) {
      alert('월은 1월부터 12월 사이여야 합니다.');
      return;
    }

    if (dayNum < 1 || dayNum > 31) {
      alert('일은 1일부터 31일 사이여야 합니다.');
      return;
    }

    onAddFriend({
      id: Date.now(),
      name,
      year: yearNum,
      month: monthNum,
      day: dayNum,
      isLunar,
    });

    // 폼 초기화
    setName('');
    setBirthdate('');
    setYear('');
    setMonth('');
    setDay('');
    setIsLunar(false);
  };

  const canStartAnalysis = friends.length >= 2 && friends.length <= 8;

  return (
    <div className="friend-form-container">
      <div className="top-header">
        <div className="main-title">
          <h1 className="title-line1">사주로 보는<br/>우리 모임 관계도</h1>
        </div>
        {onShowSavedList && (
          <button
            className="saved-results-button-top"
            onClick={onShowSavedList}
          >
            저장된 결과
          </button>
        )}
      </div>
      <div className="form-card">
        <h2>친구들을 추가하고<br/>궁합을 분석해보세요 🥰</h2>
        
        <form onSubmit={handleSubmit} className="friend-form">
          <div className="form-group">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <input
              type="tel"
              inputMode="numeric"
              value={birthdate}
              onChange={handleBirthdateChange}
              placeholder="생년월일"
              maxLength={8}
              pattern="[0-9]{8}"
            />
            <div className="label-row">
              <p className="input-hint">8자리 숫자로 입력하세요 (예: 19990816)</p>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isLunar}
                  onChange={(e) => setIsLunar(e.target.checked)}
                />
                <span>음력</span>
              </label>
            </div>
          </div>

          <button type="submit" className="add-button">
            친구 추가
          </button>
        </form>

        <div className="friends-list">
          <h3>추가된 친구 ({friends.length}/8)</h3>
          <div className="friends-tags">
            {friends.map((friend) => (
              <span key={friend.id} className="friend-tag">
                {friend.name}
                <button
                  onClick={() => onRemoveFriend(friend.id)}
                  className="remove-tag"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="action-buttons">
          <button
            className="analyze-button"
            onClick={onStartAnalysis}
            disabled={!canStartAnalysis}
          >
            궁합 분석 시작
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendForm;

