import React, { useState, useRef, useEffect, useCallback } from 'react';
import { calculateDayStem, calculateDayStemLunar, calculateFullSaju, calculateCompatibilityScore, getCompatibilityLabel, getCompatibilityStyle, RELATION_TAGS } from '../utils/saju';
import './CompatibilityGraph.css';

/**
 * 텍스트 템플릿 설정
 * 
 * 점수 계산 로직 변경 시 여기만 수정하면 모든 텍스트가 자동 반영됩니다.
 * 
 * [레벨 기준]
 * - excellent: 최종 점수 80점 이상
 * - good: 최종 점수 60-79점
 * - normal: 최종 점수 40-59점
 * - caution: 최종 점수 20-39점
 * - adjustment: 최종 점수 20점 미만
 * 
 * [특성 정보 (c) 설명]
 * - c.hasStrongComplementarity: 오행 보완 점수 20점 이상 (강한 보완)
 * - c.hasModerateComplementarity: 오행 보완 점수 10-19점 (적당한 보완)
 * - c.hasWeakComplementarity: 오행 보완 점수 1-9점 (약한 보완)
 * - c.hasNoComplementarity: 오행 보완 점수 0점 (보완 없음)
 * - c.hasStrongDayPillarMatch: 일주 매칭 점수 10점 이상 (강한 일주 매칭)
 * - c.hasModerateDayPillarMatch: 일주 매칭 점수 1-9점 (적당한 일주 매칭)
 * - c.hasDayPillarConflict: 일주 매칭 점수 음수 (일주 충돌)
 * - c.hasNoDayPillarMatch: 일주 매칭 점수 0점 (일주 매칭 없음)
 * - c.hasTianganHe: 천간합 태그 (가치관이 조화를 이룸)
 * - c.hasTianganChong: 천간충 태그 (가치관 충돌)
 * - c.hasJijiHe: 지지 육합/삼합 태그 (성격이 잘 맞음)
 * - c.hasJijiChong: 지지충/원진/귀문 태그 (성격 충돌)
 * - c.hasSameStem: 같은 일간(비견) 태그 (서로 비슷한 특성)
 * - c.hasComplementary: 오행 상호보완 태그 (에너지 보완)
 * - c.hasSimilarWuxing: 오행 분포 유사 태그 (오행 분포가 비슷함)
 * - c.hasSameStrongWuxing: 같은 오행 과다 태그 (둘 다 같은 오행이 강함)
 * - c.hasDayPillarMatch: 일주 매칭 점수 양수 (일주 매칭 있음)
 * - c.hasNegativeDayPillar: 일주 매칭에서 충돌 요소 있음 (천간충 또는 지지충)
 * 
 * [조건 우선순위]
 * 각 레벨 내에서 위에서부터 순서대로 조건을 확인하고, 첫 번째로 만족하는 조건의 텍스트를 사용합니다.
 * 마지막 조건은 항상 `() => true`로 설정하여 기본 텍스트(fallback)로 사용됩니다.
 */
const TEXT_TEMPLATES = {
  // 최종 점수 75점 이상: 최상의 관계
  excellent: {
    catchphrase: [
      { 
        // 조건: 강한 오행 보완(20점 이상) + 천간합 또는 지지합 + 충돌 없음
        condition: (c) => c.hasStrongComplementarity && (c.hasTianganHe || c.hasJijiHe) && !c.hasNegativeDayPillar,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n로또 1등 당첨급 확률!\n놓치면 평생 후회할 최강 소울메이트에요.`
      },
      { 
        // 조건: 천간합 또는 지지합 있음 (가치관/성격이 조화를 이룸)
        condition: (c) => c.hasTianganHe || c.hasJijiHe,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n이건 중력의 법칙인가요?\n성격은 달라도 자석처럼 끌리는 사이!`
      },
      { 
        // 조건: 오행 보완 태그 + 강한 오행 보완(20점 이상) (에너지 보완이 강함)
        condition: (c) => c.hasComplementary && c.hasStrongComplementarity,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n걸어 다니는 보조 배터리!\n방전된 나를 풀충전 시켜주는 귀인 같은 존재예요.`
      },
      { 
        // 기본 텍스트 (위 조건에 해당하지 않는 모든 excellent 레벨)
        condition: () => true,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n설명이 필요 없는 갓벽한 사이!\n특별히 노력하지 않아도 숨 쉬듯이 잘 맞는 사이에요.`
      },
    ],
    hashtags: ['#소울메이트', '#상호보완', '#속이편안'],
  },
  // 최종 점수 55-74점: 좋은 관계
  good: {
    catchphrase: [
      { 
        // 조건: 천간합 또는 지지합 + 적당한 오행 보완(10-19점)
        // 의미: 에너지와 가치관이 조화를 이루는 좋은 조합
        condition: (c) => (c.hasTianganHe || c.hasJijiHe) && c.hasModerateComplementarity,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n자석처럼 서로를 끌어당겨요!\n서로의 다름이 매력으로 느껴지는 꿀조합.`
      },
      { 
        // 조건: 천간합 또는 지지합 있음 (가치관/성격이 조화를 이루지만 보완은 약함)
        condition: (c) => c.hasTianganHe || c.hasJijiHe,
        text: (names) => `${names[0]}님과 ${names[1]}님,\n자석의 N극과 S극인가요?\n이유 없이 끌리는 묘한 사이!`
      },
      { 
        // 조건: 오행 보완 태그 + 적당한 오행 보완(10-19점) (에너지 보완은 있지만 가치관/성격 매칭은 약함)
        condition: (c) => c.hasComplementary && c.hasModerateComplementarity,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n서로에게 없는 점을 쏙쏙 채워줘요.\n만날수록 서로 득이 되는\nWin-Win 관계!`
      },
      { 
        // 조건: 약한 보완(1-9점) + 일주 매칭 (둘 다 약하지만 합쳐서 좋음)
        condition: (c) => c.hasWeakComplementarity && c.hasDayPillarMatch,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n작은 것들이 모여 큰 시너지를 만드는\n꾸준한 관계예요.`
      },
      { 
        // 조건: 오행 분포 유사 + 일주 매칭 있음 (보완은 없지만 비슷하고 가치관도 조화를 이룸)
        condition: (c) => c.hasSimilarWuxing && c.hasDayPillarMatch && !c.hasSameStem,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n오행 분포가 비슷해서 서로 이해하기 쉬워요.\n가치관도 조화를 이루어서 좋은 관계예요.`
      },
      { 
        // 조건: 보완 없지만 일주 매칭 있음 (가치관/성격은 맞지만 에너지 보완은 없음)
        condition: (c) => c.hasNoComplementarity && c.hasDayPillarMatch && !c.hasSimilarWuxing,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n마음은 잘 맞지만 에너지 보완은 약해요.\n대화로 서로를 이해하는 관계예요.`
      },
      { 
        // 조건: 같은 일간(비견) 태그
        condition: (c) => c.hasSameStem,
        text: (names) => `눈빛만 봐도 딱 알겠네!\n생각하는 회로가 비슷해서\n척하면 척! 통하는 사이예요.`
      },
      { 
        // 기본 텍스트 (위 조건에 해당하지 않는 모든 good 레벨)
        condition: () => true,
        text: (names) => `자극적인 마라맛은 아니지만\n평냉처럼 담백하고 편안한 관계에요.`
      },
    ],
    hashtags: ['#좋은팀워크', '#균형잡힌관계', '#상호보완'],
  },
  // 최종 점수 40-54점: 보통 관계
  normal: {
    catchphrase: [
      { 
        // 조건: 오행 보완 태그 + 적당한 오행 보완(10-19점) (서로를 보완하는 관계)
        // 충돌이 있어도 보완이 있으면 보완을 우선 강조
        condition: (c) => c.hasComplementary && c.hasModerateComplementarity && !c.hasSameStem,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n서로에게 없는 점을 채워주는\n보완적인 관계예요.`
      },
      { 
        // 조건: 천간충 또는 지지충 + 약한 보완 (충돌이 있지만 약한 보완도 있어서 애증 관계)
        condition: (c) => (c.hasTianganChong || c.hasJijiChong) && c.hasWeakComplementarity && !c.hasSameStem,
        text: (names) => `${names[0]}님과 ${names[1]}님은 만나면 투닥투닥, 없으면 또 심심한\n애증의 환장 케미!`
      },
      { 
        // 조건: 천간충 또는 지지충 태그 (순수 충돌, 보완 없음)
        condition: (c) => (c.hasTianganChong || c.hasJijiChong) && !c.hasComplementary && !c.hasSameStem,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n의견이 자주 충돌하지만\n서로를 자극하는 관계예요.`
      },
      { 
        // 조건: 오행 분포 유사 + 일주 매칭 있음 (보완은 없지만 비슷해서 이해하기 쉬움)
        condition: (c) => c.hasSimilarWuxing && c.hasDayPillarMatch && !c.hasSameStem,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n오행 분포가 비슷해서 서로 이해하기 쉬워요.\n가치관도 조화를 이루어서 좋은 관계예요.`
      },
      { 
        // 조건: 오행 분포 유사 + 일주 매칭 없음 (보완은 없지만 비슷함)
        condition: (c) => c.hasSimilarWuxing && c.hasNoDayPillarMatch && !c.hasSameStem,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n오행 분포가 비슷해서 서로 이해하기 쉬워요.\n함께 성장할 수 있는 관계예요.`
      },
      { 
        // 조건: 보완 없음 + 일주 매칭 없음 (중립적, 특별한 매력 없음)
        condition: (c) => c.hasNoComplementarity && c.hasNoDayPillarMatch,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n특별한 매력은 없지만\n무난하게 지낼 수 있는 관계예요.`
      },
      { 
        // 조건: 약한 보완만 (에너지 보완은 약간 있음)
        condition: (c) => c.hasWeakComplementarity && !c.hasDayPillarMatch,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n서로에게 약간의 도움은 되지만\n큰 시너지는 기대하기 어려워요.`
      },
      { 
        // 조건: 약한 일주 매칭만 (가치관/성격 매칭은 약간 있음)
        condition: (c) => c.hasModerateDayPillarMatch && c.hasNoComplementarity,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n가치관이 약간 조화를 이루지만\n에너지 보완은 없어요.`
      },
      { 
        // 조건: 천간합 또는 지지합 있음
        condition: (c) => c.hasTianganHe || c.hasJijiHe,
        text: (names) => `${names[0]}님과 ${names[1]}님은 손발을 조금만 더 맞춰보면 엄청난 시너지가 날 수 있는 '잠재력 만렙' 관계입니다.`
      },
      { 
        // 기본 텍스트 (위 조건에 해당하지 않는 모든 normal 레벨)
        condition: () => true,
        text: (names) => `${names[0]}님과 ${names[1]}님은 처음에는 서로에게 관심없지만 시간이 지날수록 진국이 되는 관계예요.`
      },
    ],
    hashtags: ['#나쁘지않아', '#맞춰가는재미'],
  },
  // 최종 점수 25-39점: 주의 필요
  caution: {
    catchphrase: [
      { 
        // 조건: 천간충 또는 지지충 + 약한 보완 (충돌이 있지만 완전히 나쁜 건 아님)
        condition: (c) => (c.hasTianganChong || c.hasJijiChong) && c.hasWeakComplementarity && !c.hasSameStem,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n충돌이 있지만 약간의 보완도 있어서\n복잡한 관계예요.`
      },
      { 
        // 조건: 천간충 또는 지지충 태그 (순수 충돌)
        condition: (c) => (c.hasTianganChong || c.hasJijiChong) && !c.hasSameStem,
        text: (names) => `혹시 전생에 라이벌?\n${names[0]}님과 ${names[1]}님은 만나면 불꽃 튀는 논쟁이 시작되는 마라맛 디베이트 클럽!`
      },
      { 
        // 조건: 오행 분포 유사 + 일주 매칭 있음 (보완은 없지만 비슷하고 가치관도 조화를 이룸)
        condition: (c) => c.hasSimilarWuxing && c.hasDayPillarMatch && !c.hasSameStem,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n오행 분포가 비슷해서 서로 이해하기 쉬워요.\n가치관도 조화를 이루어서 좋은 관계예요.`
      },
      { 
        // 조건: 오행 분포 유사 + 일주 매칭 없음 (보완은 없지만 비슷함)
        condition: (c) => c.hasSimilarWuxing && c.hasNoDayPillarMatch && !c.hasSameStem,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n서로 비슷해서 편안하고 이해하기 쉽지만\n특별한 매력은 못느껴요.`
      },
      { 
        // 조건: 보완 없음 + 일주 매칭 없음 (아무 매력도 없음)
        condition: (c) => c.hasNoComplementarity && c.hasNoDayPillarMatch && !c.hasSameStem,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n서로에게 특별한 매력이 없는 관계예요.\n거리를 두는 게 편할 수 있어요.`
      },
      { 
        // 조건: 약한 보완만 (에너지 보완은 약간 있지만 충돌도 있음)
        condition: (c) => c.hasWeakComplementarity && !c.hasDayPillarMatch && !c.hasSameStem,
        text: (names) => `${names[0]}님과 ${names[1]}님은\n약간의 보완은 있지만\n서로 맞지 않는 부분이 더 많아요.`
      },
      { 
        // 기본 텍스트 (위 조건에 해당하지 않는 모든 caution 레벨)
        condition: () => true,
        text: (names) => `안드로이드와 아이폰의 만남!\n${names[0]}님과 ${names[1]}님은\n충전기 단자부터 다른 서로를 위해 호환 젠더가 꼭 필요해요.`
      },
    ],
    hashtags: ['#번역이필요해', '#다름의미학'],
  },
  // 최종 점수 20점 미만: 조율 필요
  adjustment: {
    catchphrase: [
      { 
        // 기본 텍스트 (모든 adjustment 레벨)
        condition: () => true,
        text: (names) => `이 만남, 실화인가요?\n${names[0]}님과 ${names[1]}님은 서로의 '거리'를 확실히 존중해야 평화로운 '불가침 조약' 관계!`
      },
    ],
    hashtags: ['#난이도최상', '#존중이답이다'],
  },
};

const CompatibilityGraph = ({ friends, onBack }) => {
  const [selectedLink, setSelectedLink] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [resultTitle, setResultTitle] = useState('');
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [activeTooltip, setActiveTooltip] = useState(null); // 툴팁 상태 관리
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const hashtagRef = useRef(null); // 해시태그 컨테이너 참조

  // 툴팁 밖 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeTooltip && hashtagRef.current) {
        // 해시태그나 툴팁 내부를 클릭한 경우가 아니면 툴팁 닫기
        const clickedElement = event.target;
        const isInsideHashtag = hashtagRef.current.contains(clickedElement);
        const isHashtagElement = clickedElement.classList?.contains('hashtag') || 
                                 clickedElement.closest?.('.hashtag');
        const isTooltipElement = clickedElement.classList?.contains('hashtag-tooltip') || 
                                 clickedElement.closest?.('.hashtag-tooltip');
        
        if (!isInsideHashtag && !isHashtagElement && !isTooltipElement) {
          setActiveTooltip(null);
        }
      }
    };

    if (activeTooltip) {
      // 약간의 지연 후 이벤트 리스너 등록 (현재 클릭 이벤트 처리 후)
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [activeTooltip]);

  // 오행 이모지 매핑
  const wuxingEmoji = {
    '목': '🌳',
    '화': '🔥',
    '토': '🏜️',
    '금': '💎',
    '수': '💧',
  };

  // 오행 한글명 매핑
  const wuxingNames = {
    '목': '목',
    '화': '화',
    '토': '토',
    '금': '금',
    '수': '수',
  };

  // 오행 색상 매핑
  const wuxingColors = {
    '목': '#00A73D', 
    '화': '#F44336', 
    '토': '#B46900', 
    '금': '#5A6067', 
    '수': '#006FFF', 
  };

  // 일주에서 오행 아이콘 추출
  const getIljuIcon = (dayStem) => {
    const stem = dayStem[0];
    const stemIndex = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'].indexOf(stem);
    const wuxingIndex = stemIndex !== -1 ? [0, 0, 1, 1, 2, 2, 3, 3, 4, 4][stemIndex] : 0;
    const wuxing = ['목', '화', '토', '금', '수'][wuxingIndex];
    return wuxingEmoji[wuxing] || '🌳';
  };

  // 오행 세력에서 강한/부족한 오행 계산
  const getWuxingTags = (wuxingPower) => {
    if (!wuxingPower) return { strong: [], weak: [] };
    
    const wuxingArray = ['목', '화', '토', '금', '수'];
    const powerArray = wuxingArray.map(wuxing => wuxingPower[wuxing] || 0);
    
    // 평균 계산
    const total = powerArray.reduce((a, b) => a + b, 0);
    const avg = total / powerArray.length;
    
    // 강한 오행 (평균보다 1.5배 이상)
    const strong = [];
    // 부족한 오행 (평균보다 0.5배 이하, 단 스스로 보완 불가능한 경우만)
    const weak = [];
    
    // 오행 상생 관계 (생성하는 쪽)
    const WUXING_SHENG = {
      0: 1, // 목생화
      1: 2, // 화생토
      2: 3, // 토생금
      3: 4, // 금생수
      4: 0, // 수생목
    };
    
    powerArray.forEach((power, idx) => {
      const wuxing = wuxingArray[idx];
      
      if (power >= avg * 1.5) {
        strong.push({ element: wuxing, power });
      } else if (power === 0) {
        // 아예 없는 오행은 생성하는 오행이 있어도 너무 약해서 부족 태그 표시
        weak.push({ element: wuxing, power });
      } else if (power <= avg * 0.5) {
        // 약간 있지만 부족한 경우, 스스로 보완 가능한지 확인
        const shengWuxingIndex = WUXING_SHENG[idx];
        const shengWuxingName = wuxingArray[shengWuxingIndex];
        const shengWuxingPower = wuxingPower[shengWuxingName] || 0;
        
        // 스스로 보완 가능하면 (생성하는 오행을 강하게 가지고 있으면) 부족 태그 표시 안 함
        if (shengWuxingPower < 4.0) {
          // 스스로 보완 불가능하므로 부족 태그 표시
          weak.push({ element: wuxing, power });
        }
        // 스스로 보완 가능하면 weak에 추가하지 않음
      }
    });
    
    strong.sort((a, b) => b.power - a.power);
    // 부족은 0이 먼저, 이후 낮은 순
    weak.sort((a, b) => a.power - b.power);
    
    return { strong, weak };
  };

  // level을 라벨로 변환 (캐치프레이즈와 동일한 기준 사용)
  const getLabelFromLevel = (level) => {
    const levelToLabel = {
      'excellent': '최상',
      'good': '좋음',
      'normal': '보통',
      'caution': '주의',
      'adjustment': '파국'
    };
    return levelToLabel[level] || '보통';
  };

  // 캐치프레이즈 생성 (설정 기반 - 점수 계산 결과의 레벨과 특성을 기반으로 자동 생성)
  const generateCatchphrase = (link) => {
    const level = link.level || 'normal';
    const characteristics = link.characteristics || {};
    const templates = TEXT_TEMPLATES[level]?.catchphrase || TEXT_TEMPLATES.normal.catchphrase;
    const names = [link.friend1Name, link.friend2Name];

    // 같은 일간(비견)이면 가장 먼저 "비슷/통한다" 톤으로 고정
    if (characteristics.hasSameStem) {
      return `${names[0]}님과 ${names[1]}님은\n기본 성향이 비슷해 척하면 척 통하는 사이예요.`;
    }
    
    // 조건에 맞는 첫 번째 템플릿 사용
    for (const template of templates) {
      if (template.condition(characteristics)) {
        return template.text(names);
      }
    }
    
    // 기본 텍스트 (fallback)
    return `${link.friend1Name}님과 ${link.friend2Name}님은\n이해와 소통을 통해\n좋은 관계를 만들어가세요.`;
  };

  // 해시태그 설명 매핑 (사주 용어 설명)
  const hashtagDescriptions = {
    '#오행상호보완': '두 사람의 오행(목, 화, 토, 금, 수)이 서로 보완하는 관계입니다. 한쪽이 부족한 에너지를 다른 쪽이 채워주는 시너지가 있어요.',
    '#천간합': '일간(일간)의 천간이 합을 이루는 관계입니다. 내면이 조화를 이루어 대화가 잘 통하고 서로 끌리는 사이예요.',
    '#일지합': '일지(일지)가 육합이나 삼합을 이루는 관계입니다. 성격이 잘 맞아 함께 있으면 편안하고 자연스러운 케미가 있어요.',
    '#월지합': '월지(월지)가 합을 이루는 관계입니다. 사회적 상황에서 호흡이 잘 맞고 팀으로 일할 때 시너지가 나요.',
    '#비견': '두 사람의 일간(일간)이 같은 관계입니다. 서로 비슷한 특성을 가져 이해하기 쉽고 통하는 부분이 많아요.',
    '#오행유사': '두 사람의 오행 분포가 비슷한 관계입니다. 서로의 에너지 구조를 이해하기 쉬워 자연스럽게 공감대가 형성돼요.',
    '#같은과다오행': '두 사람 모두 같은 오행이 강한 관계입니다. 같은 강점을 공유해 시너지가 날 수 있지만, 때로는 경쟁 구도가 될 수도 있어요.',
    '#천간충': '일간의 천간이 충을 이루는 관계입니다. 내면의 차이로 가끔 의견이 엇갈릴 수 있어 서로를 이해하려는 노력이 필요해요.',
    '#일지충': '일지가 충을 이루는 관계입니다. 성격 차이로 때때로 마찰이 있을 수 있어 적당한 거리를 유지하는 게 좋아요.',
    '#월지충': '월지가 충을 이루는 관계입니다. 사회적 상황에서 의견이 다를 수 있어 조율이 필요할 때가 있어요.',
  };

  // 해시태그 생성 (설정 기반 - 태그와 레벨을 기반으로 자동 생성)
  const generateHashtags = (link) => {
    const level = link.level || 'normal';
    const relationTags = link.tags || [];
    const tags = [];
    
    // 우선순위: 긍정적인 태그 우선, 각 태그당 1개만
    // 1. 오행 보완 (가장 중요)
    if (relationTags.includes(RELATION_TAGS.COMPLEMENTARY)) {
      tags.push('#오행상호보완');
    }
    
    // 2. 일간 합 (천간합)
    if (relationTags.includes(RELATION_TAGS.TIANGAN_HE)) {
      tags.push('#천간합');
    }
    
    // 3. 일지 합 (지지합)
    if (relationTags.includes(RELATION_TAGS.JIJI_HE)) {
      tags.push('#일지합');
    }
    
    // 4. 월지 합 (사회적)
    if (relationTags.includes(RELATION_TAGS.SOCIAL_HE)) {
      tags.push('#월지합');
    }
    
    // 5. 비견 (비슷함)
    if (relationTags.includes(RELATION_TAGS.SAME_STEM)) {
      tags.push('#비견');
    }
    
    // 6. 유사한 오행
    if (relationTags.includes(RELATION_TAGS.SIMILAR_WUXING)) {
      tags.push('#오행유사');
    }
    
    // 7. 같은 오행 과다
    if (relationTags.includes(RELATION_TAGS.SAME_STRONG_WUXING)) {
      tags.push('#같은과다오행');
    }
    
    // 부정적인 태그 추가
    if (relationTags.includes(RELATION_TAGS.TIANGAN_CHONG)) {
      tags.push('#천간충');
    }
    if (relationTags.includes(RELATION_TAGS.JIJI_CHONG)) {
      tags.push('#일지충');
    }
    if (relationTags.includes(RELATION_TAGS.SOCIAL_CHONG)) {
      tags.push('#월지충');
    }
    
    // 태그가 없으면 레벨 기반 해시태그 사용
    if (tags.length === 0) {
      tags.push(...(TEXT_TEMPLATES[level]?.hashtags || TEXT_TEMPLATES.normal.hashtags));
    }
    
    return tags;
  };

  // Q&A 분석 생성 (특성 정보 기반 - 점수 계산 결과의 특성을 활용)
  const generateAnalysis = (link) => {
    const analysis = [];
    const characteristics = link.characteristics || {};
    const hasComplementarityDetails = link.scoreDetails?.complementarity?.details?.length > 0;
    const names = [link.friend1Name, link.friend2Name];
    
    // 첫 번째 질문: 케미 (태그 기반, 긍정적인 부분만, 점수 제거, 쉬운 용어 사용)
    let chemistryAnswer = '';
    
    // 비견(같은 일간)이면 기본적으로 "비슷/이해" 톤을 우선 적용
    if (characteristics.hasSameStem && !characteristics.hasComplementary && !hasComplementarityDetails) {
      chemistryAnswer = `${names[0]}님과 ${names[1]}님은 기본 성향이 비슷해서 척하면 척 통하는 사이예요. 함께 있으면 편안하고 서로를 이해하기 쉬워요.`;
    }
    
    // 오행 분포 유사도가 높은 경우 (보완은 없지만 비슷함)
    if (!chemistryAnswer && characteristics.hasSimilarWuxing && !characteristics.hasComplementary) {
      if (characteristics.hasDayPillarMatch) {
        chemistryAnswer = `${names[0]}님과 ${names[1]}님은 오행 분포가 비슷해서 서로 이해하기 쉬워요. 가치관도 조화를 이루어서 함께 있으면 편안하고 좋은 관계예요.`;
      } else {
        chemistryAnswer = `${names[0]}님과 ${names[1]}님은 오행 분포가 비슷해서 서로 이해하기 쉬워요. 함께 성장할 수 있는 관계예요.`;
      }
    }
    
    // 특성 정보 기반 설명 우선
    if (!chemistryAnswer && characteristics.hasComplementary && hasComplementarityDetails) {
      // 모든 보완 정보를 수집 (양방향)
      const allComplementarityDetails = link.scoreDetails.complementarity.details || [];
      const processedDetails = allComplementarityDetails.map(detail => {
        // 이름 교체 (양방향 모두 처리)
        detail = detail.replace(/상대가 내 결핍 오행/g, `${link.friend2Name}님이 ${link.friend1Name}님의 부족한 에너지`);
        detail = detail.replace(/내가 상대의 결핍 오행/g, `${link.friend1Name}님이 ${link.friend2Name}님의 부족한 에너지`);
        detail = detail.replace(/상대가 /g, `${link.friend2Name}님이 `);
        detail = detail.replace(/내가 /g, `${link.friend1Name}님이 `);
        detail = detail.replace(/내 /g, `${link.friend1Name}님의 `);
        detail = detail.replace(/나의/g, `${link.friend1Name}님의`);
        detail = detail.replace(/상대의/g, `${link.friend2Name}님의`);
        // 점수 표시 제거
        detail = detail.replace(/[-+]?\d+점/g, '');
        detail = detail.replace(/좋은 팀워크: /g, '');
        detail = detail.replace(/최상의 시너지: /g, '');
        detail = detail.replace(/ - /g, '. ');
        // 전문 용어를 쉬운 말로 변경
        detail = detail.replace(/오행\(([^)]+)\)/g, '$1 에너지');
        detail = detail.replace(/오행/g, '에너지');
        detail = detail.replace(/월지급 세력/g, '강한 힘');
        detail = detail.replace(/적당한 세력/g, '적당한 힘');
        detail = detail.replace(/\(([^)]+)\)/g, '');
        return detail;
      }).filter(d => d && !d.includes('둘 다')); // "둘 다" 메시지는 별도 처리하므로 제외
      
      // 보완 정보를 자연스럽게 연결
      const complementarityText = processedDetails.join(' ');
      
      if (complementarityText) {
        if (characteristics.hasStrongComplementarity) {
          chemistryAnswer = `${complementarityText} ${link.friend1Name}님과 ${link.friend2Name}님은 서로에게 없는 것을 완벽하게 채워주는 최고의 파트너예요. 함께 있으면 편안하고 시너지가 생겨요.`;
        } else if (characteristics.hasModerateComplementarity) {
          chemistryAnswer = `${complementarityText} 서로를 잘 채워주는 좋은 관계예요. 함께 있으면 서로에게 도움이 되는 느낌이 들 거예요.`;
        } else {
          chemistryAnswer = `${complementarityText} 서로를 보완하는 요소가 있어요. 함께 있으면 서로에게 도움이 될 수 있어요.`;
        }
      }
    } else if (!chemistryAnswer && characteristics.hasComplementary) {
      chemistryAnswer = `${link.friend1Name}님과 ${link.friend2Name}님은 서로를 잘 채워주는 관계예요. 함께 있으면 서로에게 도움이 되는 느낌이 들 거예요.`;
    } else if (!chemistryAnswer && hasComplementarityDetails) {
      // 모든 보완 정보를 수집 (양방향)
      const allComplementarityDetails = link.scoreDetails.complementarity.details || [];
      const processedDetails = allComplementarityDetails.map(detail => {
        // 이름 교체 (양방향 모두 처리)
        detail = detail.replace(/상대가 내 결핍 오행/g, `${link.friend2Name}님이 ${link.friend1Name}님의 부족한 에너지`);
        detail = detail.replace(/내가 상대의 결핍 오행/g, `${link.friend1Name}님이 ${link.friend2Name}님의 부족한 에너지`);
        detail = detail.replace(/상대가 /g, `${link.friend2Name}님이 `);
        detail = detail.replace(/내가 /g, `${link.friend1Name}님이 `);
        detail = detail.replace(/내 /g, `${link.friend1Name}님의 `);
        detail = detail.replace(/나의/g, `${link.friend1Name}님의`);
        detail = detail.replace(/상대의/g, `${link.friend2Name}님의`);
        detail = detail.replace(/[-+]?\d+점/g, '');
        detail = detail.replace(/좋은 팀워크: /g, '');
        detail = detail.replace(/최상의 시너지: /g, '');
        detail = detail.replace(/ - /g, '. ');
        detail = detail.replace(/오행\(([^)]+)\)/g, '$1 에너지');
        detail = detail.replace(/오행/g, '에너지');
        detail = detail.replace(/월지급 세력/g, '강한 힘');
        detail = detail.replace(/적당한 세력/g, '적당한 힘');
        detail = detail.replace(/\(([^)]+)\)/g, '');
        return detail;
      }).filter(d => d && !d.includes('둘 다')); // "둘 다" 메시지는 별도 처리하므로 제외
      
      const complementarityText = processedDetails.join(' ');
      if (complementarityText) {
        chemistryAnswer = `${complementarityText} 서로를 보완하는 요소가 있어요.`;
      }
    } else if (!chemistryAnswer) {
      chemistryAnswer = `${link.friend1Name}님과 ${link.friend2Name}님은 함께 있으면 새로운 관점을 얻을 수 있는 관계예요. 서로 다른 강점을 가지고 있어 함께 일할 때 다양한 아이디어가 나올 수 있어요.`;
    }
    
    // 같은 오행이 강한 경우 정보 추가
    const complementarityDetails = link.scoreDetails?.complementarity?.details || [];
    const sameStrongWuxingDetails = complementarityDetails.filter(d => d.includes('둘 다') && d.includes('기운이 강해서'));
    
    if (sameStrongWuxingDetails.length > 0) {
      const sameStrongDesc = sameStrongWuxingDetails[0].split(' - ')[1] || sameStrongWuxingDetails[0];
      // "둘 다 금 기운이 강해서 서로 비슷한 강점을 가져요" 형식
      chemistryAnswer += ` ${sameStrongDesc}`;
    }
    
    // 일주 매칭 정보 추가 (일간/일지/월지 구분, 긍정적인 정보만)
    const mentalDetails = link.scoreDetails?.mental?.details || [];
    const lifestyleDetails = link.scoreDetails?.lifestyle?.details || [];
    const socialDetails = link.scoreDetails?.social?.details || [];
    
    const pillarDescriptions = [];
    
    // 일간(천간) 정보 - 긍정적인 정보만 (합, 비견)
    mentalDetails.forEach(d => {
      if (d.includes('합') || d.includes('비견')) {
        const desc = d.split(' - ')[1];
        if (desc) pillarDescriptions.push(desc);
      }
    });
    
    // 일지 정보 - 긍정적인 정보만 (합)
    lifestyleDetails.forEach(d => {
      if (d.includes('합') && !d.includes('충') && !d.includes('원진') && !d.includes('귀문')) {
        const desc = d.split(' - ')[1];
        if (desc) pillarDescriptions.push(desc);
      }
    });
    
    // 월지 정보 - 긍정적인 정보만 (합)
    socialDetails.forEach(d => {
      if (d.includes('합') && !d.includes('충') && !d.includes('원진') && !d.includes('귀문')) {
        const desc = d.split(' - ')[1];
        if (desc) pillarDescriptions.push(desc);
      }
    });
    
    // 자연스럽게 연결 (중복 제거 및 자연스러운 연결)
    if (pillarDescriptions.length > 0) {
      const uniqueDescriptions = [...new Set(pillarDescriptions)];
      chemistryAnswer += ` ${uniqueDescriptions.join(' ')}`;
    }
    
    analysis.push({
      question: '두 사람의 케미는 어떤가요?',
      answer: chemistryAnswer,
    });
    
    // 두 번째 질문: 주의할 점 (일간/일지/월지 구분, 자연스럽고 재미있게)
    let cautionAnswer = '';
    
    const negativeMentalDetails = mentalDetails.filter(d => d.includes('충'));
    const negativeLifestyleDetails = lifestyleDetails.filter(d => d.includes('충') || d.includes('원진') || d.includes('귀문'));
    const negativeSocialDetails = socialDetails.filter(d => d.includes('충') || d.includes('원진') || d.includes('귀문'));
    
    const cautionDescriptions = [];
    
    // 일간(천간) 충돌 정보
    negativeMentalDetails.forEach(d => {
      const desc = d.split(' - ')[1];
      if (desc) cautionDescriptions.push(desc);
    });
    
    // 일지 충돌 정보
    negativeLifestyleDetails.forEach(d => {
      const desc = d.split(' - ')[1];
      if (desc) cautionDescriptions.push(desc);
    });
    
    // 월지 충돌 정보
    negativeSocialDetails.forEach(d => {
      const desc = d.split(' - ')[1];
      if (desc) cautionDescriptions.push(desc);
    });
    
    // 같은 오행이 강한 경우 주의사항 추가
    if (characteristics.hasSameStrongWuxing) {
      const sameStrongDetails = complementarityDetails.filter(d => d.includes('둘 다') && d.includes('기운이 강해서'));
      if (sameStrongDetails.length > 0) {
        // 같은 오행이 강하면 경쟁이나 갈등 가능성 언급
        cautionAnswer = `${link.friend1Name}님과 ${link.friend2Name}님은 같은 오행이 강해서 가끔 경쟁이 생길 수 있어요. 하지만 서로 이해하고 조율하면 오히려 시너지를 낼 수 있는 좋은 관계가 될 수 있어요.`;
      }
    }
    
    // 충돌 정보가 있으면 자연스럽게 연결
    if (!cautionAnswer && cautionDescriptions.length > 0) {
      const uniqueCautionDescriptions = [...new Set(cautionDescriptions)];
      cautionAnswer = `${link.friend1Name}님과 ${link.friend2Name}님은 ${uniqueCautionDescriptions.join(' ')} 서로의 입장을 이해하고 존중한다면 오히려 서로를 성장시키는 관계가 될 수 있어요.`;
    } else if (!cautionAnswer && !characteristics.hasModerateComplementarity && !characteristics.hasDayPillarMatch && !characteristics.hasComplementary) {
      cautionAnswer = `서로를 채워주거나 생각이 맞는 게 특별하지 않아서 초반에는 서로를 이해하는 데 시간이 걸릴 수 있어요. 하지만 서로의 입장을 들어보고 배려한다면 좋은 관계를 만들어갈 수 있어요.`;
    } else {
      cautionAnswer = `함께 일하거나 의논할 때 서로의 의견이 다를 수 있어요. 명확하게 소통하고 서로의 생각을 존중하는 자세가 중요해요.`;
    }
    
    analysis.push({
      question: '주의할 점이 있나요?',
      answer: cautionAnswer,
    });
    
    return analysis;
  };

  // 친구 데이터에 일간 및 사주 8글자 추가
  const friendsWithStem = friends.map(friend => {
    const dayStem = friend.isLunar
      ? calculateDayStemLunar(friend.year, friend.month, friend.day)
      : calculateDayStem(friend.year, friend.month, friend.day);
    
    // 사주 8글자 계산 (시주가 null이면 6글자만 계산)
    const fullSaju = calculateFullSaju(
      friend.year, 
      friend.month, 
      friend.day, 
      friend.hour !== undefined ? friend.hour : null,
      friend.minute !== undefined ? friend.minute : 0,
      friend.isLunar
    );
    
    // 시주 디버깅 정보 출력
    console.log(`[시주 확인] ${friend.name}:`, {
      입력시간: friend.hour !== null && friend.hour !== undefined 
        ? `${friend.hour}시 ${friend.minute !== null && friend.minute !== undefined ? friend.minute : 0}분`
        : '없음',
      시주: fullSaju.hour_stem && fullSaju.hour_branch 
        ? `${fullSaju.hour_stem}${fullSaju.hour_branch}` 
        : '없음 (6글자)',
      전체사주: `${fullSaju.year_stem}${fullSaju.year_branch} ${fullSaju.month_stem}${fullSaju.month_branch} ${fullSaju.day_stem}${fullSaju.day_branch} ${fullSaju.hour_stem || ''}${fullSaju.hour_branch || ''}`.trim()
    });
    
    return {
      ...friend,
      dayStem,
      fullSaju, // 사주 8글자 정보 추가
    };
  });

  // 모든 관계 계산 (새로운 범용 인간관계 모델만 사용)
  const links = [];
  friendsWithStem.forEach((friend1, i) => {
    friendsWithStem.slice(i + 1).forEach((friend2) => {
      // 새로운 점수 계산 (범용 인간관계 모델)
      const compatibilityScore = calculateCompatibilityScore(
        friend1.fullSaju,
        friend2.fullSaju
      );
      
      // level 기반으로 라벨 생성 (캐치프레이즈와 동일한 기준 사용)
      const label = getLabelFromLevel(compatibilityScore.level);
      const style = getCompatibilityStyle(compatibilityScore.score);
      
      links.push({
        from: friend1.id,
        to: friend2.id,
        label,
        color: style.color,
        lineWidth: style.lineWidth,
        lineStyle: style.lineStyle,
        styleLevel: style.level, // 스타일 레벨 (1-5)
        bidirectional: true, // 모든 관계는 양방향
        friend1Name: friend1.name,
        friend2Name: friend2.name,
        friend1Stem: friend1.dayStem,
        friend2Stem: friend2.dayStem,
        // 점수 정보
        compatibilityScore: compatibilityScore.score,
        baseScore: compatibilityScore.baseScore,
        complementarityScore: compatibilityScore.complementarityScore,
        dayPillarScore: compatibilityScore.dayPillarScore,
        scoreDetails: compatibilityScore.details,
        wuxingPower: compatibilityScore.wuxingPower,
        // 레벨 및 특성 정보 (텍스트 생성에 사용)
        level: compatibilityScore.level, // 텍스트 레벨 ('excellent', 'good', 'normal', 'caution', 'adjustment')
        characteristics: compatibilityScore.characteristics,
        // 태그 정보
        tags: compatibilityScore.tags || [],
        // 설명 텍스트 (비즈니스 친화적)
        description: `${friend1.name}과(와) ${friend2.name}의 파트너십 점수는 ${compatibilityScore.score}점입니다.`,
        detailedDescription: `기본 점수 ${compatibilityScore.baseScore}점, 오행 상호보완 ${compatibilityScore.complementarityScore}점, 일주 매칭 ${compatibilityScore.dayPillarScore}점으로 구성됩니다.`,
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
  const handleSaveImage = useCallback(() => {
    if (!containerRef.current) return;

    try {
      const container = containerRef.current;
      const svg = svgRef.current;
      
      if (!svg) {
        alert('그래프를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      // SVG를 문자열로 변환
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Canvas로 변환
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        const ctx = canvas.getContext('2d');
        
        // 흰색 배경
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // SVG 이미지 그리기
        ctx.drawImage(img, 0, 0);
        
        // JPG로 변환
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `사주궁합분석_${new Date().getTime()}.jpg`;
            link.href = downloadUrl;
            link.click();
            URL.revokeObjectURL(downloadUrl);
            URL.revokeObjectURL(url);
          } else {
            alert('이미지 저장에 실패했습니다.');
          }
        }, 'image/jpeg', 0.9);
      };
      img.src = url;
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
        <h2>파트너십 분석 결과</h2>
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
            
            // dayStem 형식: '갑자' (천간+지지), 첫 글자(천간)에서 오행 추출
            const stem = friend.dayStem[0];
            const stemIndex = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'].indexOf(stem);
            const wuxingIndex = stemIndex !== -1 ? [0, 0, 1, 1, 2, 2, 3, 3, 4, 4][stemIndex] : 0;
            const wuxing = ['목', '화', '토', '금', '수'][wuxingIndex];
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
        <p>↑ 이름을 눌러 파트너십을 확인해 보세요</p>
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

      {selectedLink && (() => {
        // 오행 태그 계산
        const user1Tags = selectedLink.wuxingPower ? getWuxingTags(selectedLink.wuxingPower.userA) : { strong: [], weak: [] };
        const user2Tags = selectedLink.wuxingPower ? getWuxingTags(selectedLink.wuxingPower.userB) : { strong: [], weak: [] };
        
        // 캐치프레이즈 및 해시태그 생성
        const catchphrase = generateCatchphrase(selectedLink);
        const hashtags = generateHashtags(selectedLink);
        const analysis = generateAnalysis(selectedLink);
        
        return (
        <div className="popup-overlay" onClick={() => {
          setSelectedLink(null);
          setActiveTooltip(null);
        }}>
            <div className="popup-content-storytelling" onClick={(e) => {
              e.stopPropagation();
              // 모달 내부 빈 공간 클릭 시 툴팁 닫기
              if (e.target === e.currentTarget || e.target.classList.contains('popup-content-storytelling')) {
                setActiveTooltip(null);
              }
            }}>
            <button className="close-button" onClick={() => {
              setSelectedLink(null);
              setActiveTooltip(null);
            }}>
              ×
            </button>
              
              {/* 통합 캐치프레이즈 및 해시태그 섹션 */}
              <div className="popup-unified-section">
                <p className="catchphrase-text">{catchphrase}</p>
                <div className="hashtags" ref={hashtagRef}>
                  {hashtags.map((tag, idx) => (
                    <span 
                      key={idx} 
                      className="hashtag"
                      onClick={(e) => {
                        // 해시태그 클릭은 이벤트 전파를 막지 않음 (전역 리스너가 작동하도록)
                        setActiveTooltip(activeTooltip === tag ? null : tag);
                      }}
                    >
                      {tag}
                      {activeTooltip === tag && hashtagDescriptions[tag] && (
                        <div className="hashtag-tooltip" onClick={(e) => e.stopPropagation()}>
                          {hashtagDescriptions[tag]}
                        </div>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* 프로필 섹션 */}
              <div className="popup-profiles">
                <div className="popup-profile-card">
                  <div className="profile-header">
                    <span className="profile-name">{selectedLink.friend1Name}</span>
                    <span className="profile-ilju">
                      {getIljuIcon(selectedLink.friend1Stem)} {selectedLink.friend1Stem}
                </span>
              </div>
                  <div className="profile-tags">
                    {user1Tags.strong.slice(0, 2).map((tag, idx) => (
                      <span 
                        key={`strong-${idx}`} 
                        className="wuxing-badge strong"
                        style={{ backgroundColor: wuxingColors[tag.element] + '20', color: wuxingColors[tag.element], borderColor: wuxingColors[tag.element] }}
                      >
                        {wuxingEmoji[tag.element]} {wuxingNames[tag.element]} 기운 강함
                      </span>
                    ))}
                    {user1Tags.weak.slice(0, 1).map((tag, idx) => (
                      <span 
                        key={`weak-${idx}`} 
                        className="wuxing-badge weak"
                        style={{ backgroundColor: wuxingColors[tag.element] + '15', color: wuxingColors[tag.element], borderColor: wuxingColors[tag.element] }}
                      >
                        {wuxingEmoji[tag.element]} {wuxingNames[tag.element]} 기운 부족
                      </span>
                    ))}
              </div>
            </div>
                
                <div className="popup-profile-card">
                  <div className="profile-header">
                    <span className="profile-name">{selectedLink.friend2Name}</span>
                    <span className="profile-ilju">
                      {getIljuIcon(selectedLink.friend2Stem)} {selectedLink.friend2Stem}
                    </span>
          </div>
                  <div className="profile-tags">
                    {user2Tags.strong.slice(0, 2).map((tag, idx) => (
                      <span 
                        key={`strong-${idx}`} 
                        className="wuxing-badge strong"
                        style={{ backgroundColor: wuxingColors[tag.element] + '20', color: wuxingColors[tag.element], borderColor: wuxingColors[tag.element] }}
                      >
                        {wuxingEmoji[tag.element]} {wuxingNames[tag.element]} 기운 강함
                      </span>
                    ))}
                    {user2Tags.weak.slice(0, 1).map((tag, idx) => (
                      <span 
                        key={`weak-${idx}`} 
                        className="wuxing-badge weak"
                        style={{ backgroundColor: wuxingColors[tag.element] + '15', color: wuxingColors[tag.element], borderColor: wuxingColors[tag.element] }}
                      >
                        {wuxingEmoji[tag.element]} {wuxingNames[tag.element]} 기운 부족
                </span>
                    ))}
        </div>
                </div>
              </div>
              
              {/* Q&A 분석 섹션 */}
              <div className="popup-analysis">
                {analysis.map((item, idx) => (
                  <div key={idx} className="analysis-card">
                    <div className="analysis-question">Q: {item.question}</div>
                    <div className="analysis-answer">A: {item.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

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
