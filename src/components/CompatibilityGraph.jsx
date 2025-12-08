import React, { useState, useRef, useEffect, useCallback } from 'react';
import { calculateDayStem, calculateDayStemLunar, calculateRelationship } from '../utils/saju';
import html2canvas from 'html2canvas';
import './CompatibilityGraph.css';

const CompatibilityGraph = ({ friends, onBack }) => {
  const [selectedLink, setSelectedLink] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [resultTitle, setResultTitle] = useState('');
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  // 오행 이모지 매핑
  const wuxingEmoji = {
    '목': '🌳',
    '화': '🔥',
    '토': '⛰️',
    '금': '⚔️',
    '수': '💧',
  };

  // 친구 데이터에 일간 추가
  const friendsWithStem = friends.map(friend => ({
    ...friend,
    dayStem: friend.isLunar
      ? calculateDayStemLunar(friend.year, friend.month, friend.day)
      : calculateDayStem(friend.year, friend.month, friend.day),
  }));

  // 모든 관계 계산
  const links = [];
  friendsWithStem.forEach((friend1, i) => {
    friendsWithStem.slice(i + 1).forEach((friend2) => {
      const relationship = calculateRelationship(
        friend1.dayStem, 
        friend2.dayStem,
        friend1.id,
        friend2.id
      );
      links.push({
        from: relationship.source,
        to: relationship.target,
        ...relationship,
        friend1Name: friend1.name,
        friend2Name: friend2.name,
        friend1Stem: friend1.dayStem,
        friend2Stem: friend2.dayStem,
      });
    });
  });

  // 필터링된 링크 (노드 선택 시에만 필터링)
  const filteredLinks = selectedNodeId
    ? links.filter(link => 
        link.from === selectedNodeId || link.to === selectedNodeId
      )
    : links;

  // 노드 위치 계산 (삼각형 배치: 상단 중앙 1개, 하단 좌우 2개)
  const getNodePositions = () => {
    if (!containerRef.current) return [];
    
    const container = containerRef.current;
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    
    // 노드 박스 반지름 (CSS에서 width: 80px이므로 반지름은 40px)
    const nodeRadius = 40;
    
    // 컨테이너 경계를 벗어나지 않도록 최소/최대 좌표 계산
    // 노드 중심이 경계에서 최소 nodeRadius만큼 떨어져야 함
    const minXPercent = (nodeRadius / width) * 100;
    const maxXPercent = 100 - minXPercent;
    const minYPercent = (nodeRadius / height) * 100;
    const maxYPercent = 100 - minYPercent;
    
    // 안전한 범위로 제한 (최소 5%, 최대 95%)
    const safeMinX = Math.max(5, minXPercent);
    const safeMaxX = Math.min(95, maxXPercent);
    const safeMinY = Math.max(5, minYPercent);
    const safeMaxY = Math.min(95, maxYPercent);
    
    const positions = [];
    const count = friendsWithStem.length;
    
    // 위치를 안전한 범위로 제한하는 헬퍼 함수
    const clampX = (x) => Math.max(safeMinX, Math.min(safeMaxX, x));
    const clampY = (y) => Math.max(safeMinY, Math.min(safeMaxY, y));
    
    if (count === 1) {
      // 1명: 중앙
      positions.push({ id: friendsWithStem[0].id, x: 50, y: 50 });
    } else if (count === 2) {
      // 2명: 상단 중앙, 하단 중앙 (간격 넓게)
      positions.push({ id: friendsWithStem[0].id, x: 50, y: clampY(25) });
      positions.push({ id: friendsWithStem[1].id, x: 50, y: clampY(75) });
    } else if (count === 3) {
      // 3명: 상단 중앙 1개, 하단 좌우 2개 (간격 넓게)
      positions.push({ id: friendsWithStem[0].id, x: 50, y: clampY(20) });
      positions.push({ id: friendsWithStem[1].id, x: clampX(20), y: clampY(80) });
      positions.push({ id: friendsWithStem[2].id, x: clampX(80), y: clampY(80) });
    } else {
      // 4명 이상: 원형 배치 (반지름을 더 크게)
      const centerX = 50;
      const centerY = 50;
      // 노드 수에 따라 반지름 조정 (더 넓게 배치하되 경계를 벗어나지 않도록)
      const baseRadius = 35; // 경계 여유를 두고 약간 줄임
      const maxRadius = Math.min(
        Math.min(safeMaxX - centerX, centerX - safeMinX),
        Math.min(safeMaxY - centerY, centerY - safeMinY)
      );
      const radius = Math.min(
        count <= 6 ? baseRadius : baseRadius + (count - 6) * 4,
        maxRadius
      );
      const angleStep = (2 * Math.PI) / count;
      
      friendsWithStem.forEach((friend, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        positions.push({ 
          id: friend.id, 
          x: clampX(x), 
          y: clampY(y) 
        });
      });
    }
    
    return positions;
  };

  const nodePositions = getNodePositions();

  // 컨테이너 크기 업데이트
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // SVG 경로 계산 (직선)
  const getPathD = (fromPos, toPos, isDashed = false) => {
    const width = containerSize.width;
    const height = containerSize.height;
    
    // 노드 박스 중심 좌표
    const x1Center = (fromPos.x / 100) * width;
    const y1Center = (fromPos.y / 100) * height;
    const x2Center = (toPos.x / 100) * width;
    const y2Center = (toPos.y / 100) * height;
    
    // 노드 박스 반지름 (50px = width/2)
    const nodeRadius = 40;
    
    // 두 점 사이의 거리와 각도 계산
    const dx = x2Center - x1Center;
    const dy = y2Center - y1Center;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 각도 계산 (라디안)
    const angle = Math.atan2(dy, dx);
    
    // 시작점: fromPos에서 toPos 방향으로 반지름만큼 이동
    const x1 = x1Center + Math.cos(angle) * nodeRadius;
    const y1 = y1Center + Math.sin(angle) * nodeRadius;
    
    // 끝점: toPos에서 fromPos 반대 방향으로 반지름만큼 이동
    const x2 = x2Center - Math.cos(angle) * nodeRadius;
    const y2 = y2Center - Math.sin(angle) * nodeRadius;
    
    // 직선 경로: M (시작점) L (끝점)
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  };

  // 화살표 마커는 JSX에서 동적으로 생성하므로 useEffect 제거

  // 노드 클릭 핸들러
  const handleNodeClick = (nodeId) => {
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(nodeId);
    }
    setSelectedLink(null);
  };

  // 링크 클릭 핸들러
  const handleLinkClick = (link) => {
    setSelectedLink(link);
  };

  // 이미지 저장 함수
  const handleSaveImage = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      const container = containerRef.current;
      
      // html2canvas로 전체 컨테이너 캡처 (노드박스 포함)
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2, // 고해상도
        logging: false,
        useCORS: true,
      });
      
      // JPG로 변환
      canvas.toBlob((blob) => {
        if (blob) {
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `사주궁합분석_${new Date().getTime()}.jpg`;
          link.href = downloadUrl;
          link.click();
          URL.revokeObjectURL(downloadUrl);
        } else {
          alert('이미지 저장에 실패했습니다.');
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('이미지 저장 실패:', error);
      alert('이미지 저장 중 오류가 발생했습니다.');
    }
  }, []);

  // 결과 저장 함수
  const handleSaveResultClick = useCallback(() => {
    setResultTitle(`분석 결과 (${friends.length}명)`);
    setShowTitleModal(true);
  }, [friends]);

  const handleSaveResult = useCallback(() => {
    if (!resultTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    const result = {
      id: Date.now(),
      title: resultTitle.trim(),
      friends: friends,
      savedAt: new Date().toISOString(),
    };

    const saved = localStorage.getItem('sajuResults');
    let results = [];
    if (saved) {
      try {
        results = JSON.parse(saved);
      } catch (error) {
        console.error('저장된 결과 불러오기 실패:', error);
      }
    }

    results.push(result);

    if (results.length > 50) {
      results = results.slice(-50);
    }

    localStorage.setItem('sajuResults', JSON.stringify(results));
    alert('결과가 저장되었습니다!');
    setShowTitleModal(false);
    setResultTitle('');
  }, [friends, resultTitle]);

  return (
    <div className="graph-container">
      <div className="graph-header">
        <button onClick={onBack} className="back-button">
          뒤로
        </button>
        <h2>궁합 분석 결과</h2>
      </div>
      {selectedNodeId && (
        <div className="selected-node-info">
          <p>
            <strong>{friendsWithStem.find(f => f.id === selectedNodeId)?.name}</strong>님을 기준으로 한 관계도
            <button 
              onClick={() => setSelectedNodeId(null)} 
              className="reset-view-text-button"
            >
              전체 보기
            </button>
          </p>
        </div>
      )}

      <div className="graph-wrapper">
        <div ref={containerRef} className="graph-svg-container">
          <svg 
            ref={svgRef}
            className="graph-svg"
            width="100%"
            height="100%"
            viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* 각 링크의 색상에 맞는 화살표 마커 생성 */}
              {filteredLinks.map((link) => {
                const linkColor = link.color || '#999';
                const markerId = `arrowhead-${link.from}-${link.to}`;
                return (
                  <marker
                    key={markerId}
                    id={markerId}
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <line x1="0" y1="0" x2="6" y2="3" stroke={linkColor} strokeWidth="1.5" />
                    <line x1="0" y1="6" x2="6" y2="3" stroke={linkColor} strokeWidth="1.5" />
                  </marker>
                );
              })}
            </defs>
            
            {/* 연결선 그리기 */}
            {filteredLinks.map((link, linkIndex) => {
              const fromPos = nodePositions.find(p => p.id === link.from);
              const toPos = nodePositions.find(p => p.id === link.to);
              if (!fromPos || !toPos) return null;
              
              const pathD = getPathD(fromPos, toPos, link.lineStyle === 'dashed');
              
              // 연결선의 실제 시작점과 끝점 계산 (경계에서)
              const width = containerSize.width;
              const height = containerSize.height;
              const x1Center = (fromPos.x / 100) * width;
              const y1Center = (fromPos.y / 100) * height;
              const x2Center = (toPos.x / 100) * width;
              const y2Center = (toPos.y / 100) * height;
              
              const nodeRadius = 50;
              const dx = x2Center - x1Center;
              const dy = y2Center - y1Center;
              const angle = Math.atan2(dy, dx);
              
              // 중간점 계산 (경계에서의 실제 중간점)
              const midX = (x1Center + x2Center) / 2;
              const midY = (y1Center + y2Center) / 2;
              
              // 텍스트를 라인과 평행하게 회전시키기 위한 각도 (도 단위)
              let angleDeg = (angle * 180) / Math.PI;
              
              // 텍스트가 뒤집히지 않도록 각도 조정 (-90도 ~ 90도 범위로)
              let adjustedAngle = angle;
              if (angleDeg > 90) {
                angleDeg -= 180;
                adjustedAngle = angle - Math.PI;
              } else if (angleDeg < -90) {
                angleDeg += 180;
                adjustedAngle = angle + Math.PI;
              }
              
              // 텍스트 오프셋 (겹치지 않도록 충분한 간격)
              const offsetDistance = 15;
              const offsetX = Math.cos(adjustedAngle + Math.PI / 2) * offsetDistance;
              const offsetY = Math.sin(adjustedAngle + Math.PI / 2) * offsetDistance;
              
              // 각 링크마다 다른 오프셋 적용 (홀수/짝수로 구분)
              const finalOffsetX = linkIndex % 2 === 0 ? offsetX : -offsetX;
              const finalOffsetY = linkIndex % 2 === 0 ? offsetY : -offsetY;
              
              return (
                <g key={`${link.from}-${link.to}`}>
                  <path
                    d={pathD}
                    stroke={link.color || '#999'}
                    strokeWidth={2}
                    fill="none"
                    strokeDasharray={link.lineStyle === 'dashed' ? '5,5' : 'none'}
                    markerEnd={`url(#arrowhead-${link.from}-${link.to})`}
                    className="link-path"
                    onClick={() => handleLinkClick(link)}
                    style={{ cursor: 'pointer' }}
                  />
                  <text
                    x={midX + finalOffsetX}
                    y={midY + finalOffsetY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#333"
                    fontSize="14"
                    fontFamily="Pretendard, sans-serif"
                    className="link-label"
                    onClick={() => handleLinkClick(link)}
                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                    transform={`rotate(${angleDeg}, ${midX + finalOffsetX}, ${midY + finalOffsetY})`}
                  >
                    <tspan
                      x={midX + finalOffsetX}
                      y={midY + finalOffsetY}
                      fill="white"
                      stroke="white"
                      strokeWidth="0.3em"
                    >
                      {link.label}
                    </tspan>
                    <tspan
                      x={midX + finalOffsetX}
                      y={midY + finalOffsetY}
                      fill="#333"
                    >
                      {link.label}
                    </tspan>
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* 노드 (div로 배치) */}
          {friendsWithStem.map((friend) => {
            const position = nodePositions.find(p => p.id === friend.id);
            if (!position) return null;
            
            const wuxing = friend.dayStem.slice(1);
            const emoji = wuxingEmoji[wuxing] || '🌳';
            const isSelected = selectedNodeId === friend.id;
            
            return (
              <div
                key={friend.id}
                className={`node-box ${isSelected ? 'selected' : ''}`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => handleNodeClick(friend.id)}
              >
                <div className="node-name">{friend.name}</div>
                <div className="node-stem">
                  {emoji}{friend.dayStem}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="instruction-text">
        <p>↑ 이름을 눌러 궁합을 확인해 보세요</p>
      </div>

      <div className="bottom-action-buttons">
        <button 
          onClick={handleSaveImage} 
          className="save-image-button"
          title="이미지로 저장"
        >
          📷 이미지 저장
        </button>
        <button 
          onClick={handleSaveResultClick} 
          className="save-result-button"
          title="결과 저장"
        >
          💾 결과 저장
        </button>
      </div>

      {selectedLink && (
        <div className="popup-overlay" onClick={() => setSelectedLink(null)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedLink(null)}>
              ×
            </button>
            <h3>상세 궁합 정보</h3>
            <div className="popup-info">
              <div className="popup-pair">
                <span className="friend-name">{selectedLink.friend1Name}</span>
                <span className="stem-info">{selectedLink.friend1Stem}</span>
              </div>
              <div className="popup-relationship">
                <span className={`relationship-badge level-${selectedLink.level}`}>
                  {selectedLink.label}
                </span>
              </div>
              <div className="popup-pair">
                <span className="friend-name">{selectedLink.friend2Name}</span>
                <span className="stem-info">{selectedLink.friend2Stem}</span>
              </div>
            </div>
            <p className="popup-description">{selectedLink.description}</p>
            {selectedLink.detailedDescription && (
              <p className="popup-detailed-description">{selectedLink.detailedDescription}</p>
            )}
          </div>
        </div>
      )}

      {showTitleModal && (
        <div className="popup-overlay" onClick={() => setShowTitleModal(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowTitleModal(false)}>
              ×
            </button>
            <h3>결과 저장</h3>
            <div className="title-input-group">
              <label>제목</label>
              <input
                type="text"
                value={resultTitle}
                onChange={(e) => setResultTitle(e.target.value)}
                placeholder="결과 제목을 입력하세요"
                maxLength={50}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveResult();
                  }
                }}
              />
            </div>
            <div className="popup-actions">
              <button onClick={() => setShowTitleModal(false)} className="cancel-button">
                취소
              </button>
              <button onClick={handleSaveResult} className="save-button">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompatibilityGraph;
