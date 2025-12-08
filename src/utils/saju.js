// 사주 일간 계산 및 궁합 분석 유틸리티

// 천간 배열 (10개)
const TIANGAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
// 천간 오행 (0: 목, 1: 화, 2: 토, 3: 금, 4: 수)
const TIANGAN_WUXING = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
// 천간 음양 (true: 양, false: 음)
// 양: 갑(0), 병(2), 무(4), 경(6), 임(8)
// 음: 을(1), 정(3), 기(5), 신(7), 계(9)
const TIANGAN_YINYANG = [true, false, true, false, true, false, true, false, true, false];

// 오행 상생 관계 (생성하는 쪽)
const WUXING_SHENG = {
  0: 1, // 목생화
  1: 2, // 화생토
  2: 3, // 토생금
  3: 4, // 금생수
  4: 0, // 수생목
};

// 오행 상극 관계 (극하는 쪽)
const WUXING_KE = {
  0: 2, // 목극토
  1: 3, // 화극금
  2: 4, // 토극수
  3: 0, // 금극목
  4: 1, // 수극화
};

/**
 * 양력 생년월일로 일간 계산
 * @param {number} year - 연도
 * @param {number} month - 월 (1-12)
 * @param {number} day - 일
 * @returns {string} 일간 (예: '갑목')
 */
export function calculateDayStem(year, month, day) {
  // 기준일: 1900년 1월 1일 = 갑술(甲戌), 천간 인덱스 0 (갑)
  const BASE_YEAR = 1900;
  const BASE_MONTH = 1;
  const BASE_DAY = 1;
  const BASE_STEM_INDEX = 0; // 갑
  
  // 기준일과 목표일을 생성하고 시간을 00:00:00으로 초기화 (시차 보정)
  const baseDate = new Date(BASE_YEAR, BASE_MONTH - 1, BASE_DAY);
  baseDate.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);
  
  // 총 일수 계산 (밀리초 차이를 일수로 변환)
  const diffTime = targetDate - baseDate;
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // 하루 밀림 보정
  
  // 일간 인덱스 계산: (총 일수 + 기준일 천간 인덱스) % 10
  const stemIndex = (totalDays + BASE_STEM_INDEX) % 10;
  
  // 음수 처리 (과거 날짜의 경우)
  const finalStemIndex = stemIndex >= 0 ? stemIndex : stemIndex + 10;
  
  const stem = TIANGAN[finalStemIndex];
  const wuxing = ['목', '화', '토', '금', '수'][TIANGAN_WUXING[finalStemIndex]];
  
  return stem + wuxing;
}

/**
 * 음력 생년월일로 일간 계산 (간단한 변환)
 * @param {number} year - 연도
 * @param {number} month - 월
 * @param {number} day - 일
 * @returns {string} 일간
 */
export function calculateDayStemLunar(year, month, day) {
  // 음력은 복잡하므로 여기서는 양력과 약간의 오프셋을 적용
  // 실제로는 음력 변환 라이브러리가 필요함
  return calculateDayStem(year, month, day);
}

/**
 * 일간에서 오행 추출
 * @param {string} dayStem - 일간 (예: '갑목')
 * @returns {number} 오행 인덱스 (0: 목, 1: 화, 2: 토, 3: 금, 4: 수)
 */
function getWuxingFromStem(dayStem) {
  const stem = dayStem[0];
  const index = TIANGAN.indexOf(stem);
  if (index === -1) return 0;
  return TIANGAN_WUXING[index];
}

/**
 * 두 사람의 궁합 점수 계산
 * 파라미터 순서와 무관하게 절대적 오행 관계를 판단
 * @param {string} stem1 - 첫 번째 사람의 일간
 * @param {string} stem2 - 두 번째 사람의 일간
 * @returns {object} 궁합 정보
 */
export function calculateCompatibility(stem1, stem2) {
  const wuxing1 = getWuxingFromStem(stem1);
  const wuxing2 = getWuxingFromStem(stem2);
  
  // 같은 오행 (비화)
  if (wuxing1 === wuxing2) {
    return {
      level: 3, // 보통
      label: '보통',
      description: '같은 오행으로 서로 비슷한 성향을 가지고 있습니다.',
      color: '#FFA500',
    };
  }
  
  // 절대적 오행 관계 판단 (파라미터 순서와 무관)
  const wuxingRel = getAbsoluteWuxingRelationship(wuxing1, wuxing2);
  
  // 상생 관계
  if (wuxingRel && wuxingRel.type === 'sheng') {
    const sourceStem = (wuxingRel.source === wuxing1) ? stem1 : stem2;
    const targetStem = (wuxingRel.target === wuxing1) ? stem1 : stem2;
    return {
      level: 1, // 천생연분
      label: '천생연분',
      description: `${sourceStem}이(가) ${targetStem}을(를) 생하는 상생 관계입니다. 서로를 도와주는 완벽한 궁합입니다!`,
      color: '#4CAF50',
    };
  }
  
  // 상극 관계
  if (wuxingRel && wuxingRel.type === 'ke') {
    const sourceStem = (wuxingRel.source === wuxing1) ? stem1 : stem2;
    const targetStem = (wuxingRel.target === wuxing1) ? stem1 : stem2;
    return {
      level: 5, // 파국
      label: '파국',
      description: `${sourceStem}이(가) ${targetStem}을(를) 극하는 상극 관계입니다. 충돌이 있을 수 있습니다.`,
      color: '#F44336',
    };
  }
  
  // 그 외의 경우 (비상생비상극)
  // 오행 간의 거리에 따라 점수 부여
  const diff = Math.abs(wuxing1 - wuxing2);
  if (diff === 1 || diff === 4) {
    return {
      level: 2, // 좋음
      label: '좋음',
      description: '서로 잘 어울리는 관계입니다.',
      color: '#8BC34A',
    };
  } else {
    return {
      level: 4, // 그닥
      label: '그닥',
      description: '특별한 상성은 없지만 무난한 관계입니다.',
      color: '#FF9800',
    };
  }
}

/**
 * 궁합 레벨에 따른 한글 라벨
 */
export const COMPATIBILITY_LABELS = {
  1: '천생연분',
  2: '좋음',
  3: '보통',
  4: '그닥',
  5: '파국',
};

/**
 * 일간에서 천간 인덱스 추출
 * @param {string} dayStem - 일간 (예: '갑목')
 * @returns {number} 천간 인덱스 (0-9)
 */
function getStemIndex(dayStem) {
  const stem = dayStem[0];
  return TIANGAN.indexOf(stem);
}

/**
 * 일간에서 음양 추출
 * @param {string} dayStem - 일간 (예: '갑목')
 * @returns {boolean} true면 양, false면 음
 */
function getYinYang(dayStem) {
  const index = getStemIndex(dayStem);
  return TIANGAN_YINYANG[index];
}

/**
 * 오행 간의 절대적 관계 판단 (파라미터 순서와 무관)
 * @param {number} wuxing1 - 첫 번째 오행 (0: 목, 1: 화, 2: 토, 3: 금, 4: 수)
 * @param {number} wuxing2 - 두 번째 오행
 * @returns {object|null} 관계 정보 { type: 'sheng'|'ke'|null, source: wuxing, target: wuxing }
 *   - type: 'sheng' (상생), 'ke' (상극), null (관계 없음)
 *   - source: 관계의 주체 (생하거나 극하는 쪽)
 *   - target: 관계의 객체 (생받거나 극당하는 쪽)
 */
function getAbsoluteWuxingRelationship(wuxing1, wuxing2) {
  // 같은 오행인 경우 관계 없음
  if (wuxing1 === wuxing2) {
    return null;
  }

  // 상생/상극을 절대 규칙 테이블로만 판단해 파라미터 순서에 영향받지 않도록 정규화
  const SHENG_RULES = [
    [0, 1], // 목 -> 화
    [1, 2], // 화 -> 토
    [2, 3], // 토 -> 금
    [3, 4], // 금 -> 수
    [4, 0], // 수 -> 목
  ];
  const KE_RULES = [
    [0, 2], // 목 -> 토
    [2, 4], // 토 -> 수
    [4, 1], // 수 -> 화
    [1, 3], // 화 -> 금
    [3, 0], // 금 -> 목
  ];

  // 상생 확인
  for (const [source, target] of SHENG_RULES) {
    if (wuxing1 === source && wuxing2 === target) {
      return { type: 'sheng', source, target };
    }
    if (wuxing2 === source && wuxing1 === target) {
      return { type: 'sheng', source, target };
    }
  }

  // 상극 확인
  for (const [source, target] of KE_RULES) {
    if (wuxing1 === source && wuxing2 === target) {
      return { type: 'ke', source, target };
    }
    if (wuxing2 === source && wuxing1 === target) {
      return { type: 'ke', source, target };
    }
  }

  // 관계 없음
  return null;
}

/**
 * 십성과 합충 개념을 적용한 관계 계산
 * 절대 우선순위에 따라 if-else if 구조로 작성
 * @param {string} me - 내 일간 (예: '갑목')
 * @param {string} you - 상대방 일간 (예: '을목')
 * @param {number} meId - 내 ID
 * @param {number} youId - 상대방 ID
 * @returns {object} 관계 정보 (source, target 포함)
 */
export function calculateRelationship(me, you, meId, youId) {
  const meIndex = getStemIndex(me);
  const youIndex = getStemIndex(you);
  const meWuxing = getWuxingFromStem(me);
  const youWuxing = getWuxingFromStem(you);

  // ============================================
  // 1순위: 특수 관계 (합 & 충) - 최우선
  // ============================================
  
  // 천간합 (LOVE) - 갑-기(0-5), 을-경(1-6), 병-신(2-7), 정-임(3-8), 무-계(4-9)
  // 양방향 관계
  if ((meIndex === 0 && youIndex === 5) || (meIndex === 5 && youIndex === 0) || // 갑-기
      (meIndex === 1 && youIndex === 6) || (meIndex === 6 && youIndex === 1) || // 을-경
      (meIndex === 2 && youIndex === 7) || (meIndex === 7 && youIndex === 2) || // 병-신
      (meIndex === 3 && youIndex === 8) || (meIndex === 8 && youIndex === 3) || // 정-임
      (meIndex === 4 && youIndex === 9) || (meIndex === 9 && youIndex === 4)) { // 무-계
    return {
      level: 1,
      label: '❤️운명의 짝꿍',
      description: `${me}과(와) ${you}의 천간합 관계입니다. 운명적으로 끌리는 특별한 인연입니다!`,
      detailedDescription: '운명적으로 끌리는 특별한 인연입니다. 서로를 보완하고 조화를 이루는 완벽한 궁합입니다.',
      color: '#FF69B4',
      lineWidth: 6,
      lineStyle: 'solid',
      source: meId,
      target: youId,
      bidirectional: true, // 양방향
    };
  }
  
  // 천간충 (CRASH) - 갑-경(0-6), 을-신(1-7), 병-임(2-8), 정-계(3-9)
  // 양방향 관계
  else if ((meIndex === 0 && youIndex === 6) || (meIndex === 6 && youIndex === 0) || // 갑-경
           (meIndex === 1 && youIndex === 7) || (meIndex === 7 && youIndex === 1) || // 을-신
           (meIndex === 2 && youIndex === 8) || (meIndex === 8 && youIndex === 2) || // 병-임
           (meIndex === 3 && youIndex === 9) || (meIndex === 9 && youIndex === 3)) { // 정-계
    return {
      level: 5,
      label: '⚡️애증의 관계',
      description: `${me}과(와) ${you}의 천간충 관계입니다. 서로 충돌하고 대립하는 관계입니다.`,
      detailedDescription: '서로 충돌하고 대립하는 애증의 관계입니다. 때로는 싸우지만 서로에게 강한 인상을 남기는 관계입니다.',
      color: '#FF4500',
      lineWidth: 3,
      lineStyle: 'dashed',
      source: meId,
      target: youId,
      bidirectional: true, // 양방향
    };
  }

  // ============================================
  // 2순위: 십성 상세 분석 (오행 + 음양)
  // 특수 관계가 아닐 때만 실행
  // ============================================
  
  const meYinYang = getYinYang(me);
  const youYinYang = getYinYang(you);
  const sameYinYang = meYinYang === youYinYang;
  
  // 같은 오행인 경우
  if (meWuxing === youWuxing) {
    // 비견: 같은 오행, 음양 같음 - 양방향
    if (sameYinYang) {
      return {
        level: 3,
        label: '영혼의 쌍둥이',
        description: `${me}과(와) ${you}는 같은 오행이고 음양도 같아서 서로 너무 닮은 영혼의 쌍둥이 관계입니다.`,
        detailedDescription: '서로 너무 닮아서 때로는 지루할 수 있지만, 편안하고 안정적인 관계입니다.',
        color: '#4CAF50',
        lineWidth: 2,
        lineStyle: 'solid',
        source: meId,
        target: youId,
        bidirectional: true, // 양방향
      };
    }
    // 겁재: 같은 오행, 음양 다름 - 양방향
    else {
      return {
        level: 3,
        label: '선의의 라이벌',
        description: `${me}과(와) ${you}는 같은 오행이지만 음양이 달라서 묘한 경쟁심이 있는 선의의 라이벌 관계입니다.`,
        detailedDescription: '서로 경쟁하면서도 함께 성장할 수 있는 관계입니다.',
        color: '#8BC34A',
        lineWidth: 2,
        lineStyle: 'solid',
        source: meId,
        target: youId,
        bidirectional: true, // 양방향
      };
    }
  }
  
  // 오행 관계를 절대적으로 판단 (파라미터 순서와 무관)
  const wuxingRel = getAbsoluteWuxingRelationship(meWuxing, youWuxing);
  
  // 상생 관계인 경우 (절대적 방향으로 판단)
  if (wuxingRel && wuxingRel.type === 'sheng') {
    // wuxingRel.source가 wuxingRel.target을 생함
    const isMeGiving = (wuxingRel.source === meWuxing);
    const giverId = isMeGiving ? meId : youId;
    const receiverId = isMeGiving ? youId : meId;
    const giverStem = isMeGiving ? me : you;
    const receiverStem = isMeGiving ? you : me;
    
    // 내가 상대방을 생해주는 경우 (생 관계: giver → receiver)
    // 주는 사람(giver) → 받는 사람(receiver)
    if (isMeGiving) {
      // 식신: 내가 생함, 음양 같음
      if (sameYinYang) {
        return {
          level: 2,
          label: '내 최애 아이돌',
          description: `${giverStem}이(가) ${receiverStem}을(를) 생하고 음양이 같아서 내가 덕질하는 나의 최애 아이돌 관계입니다.`,
          detailedDescription: '내가 덕질하며 응원하는 관계입니다. 상대방의 성장을 지켜보는 것이 즐거운 관계입니다.',
          color: '#2196F3', // 따뜻한 색
          lineWidth: 3,
          lineStyle: 'solid',
          source: giverId, // 주는 사람
          target: receiverId, // 받는 사람
          bidirectional: false,
        };
      }
      // 상관: 내가 생함, 음양 다름
      else {
        return {
          level: 2,
          label: '손이 많이 가는 너',
          description: `${giverStem}이(가) ${receiverStem}을(를) 생하지만 음양이 달라서 잔소리하며 챙기는 손이 많이 가는 너 관계입니다.`,
          detailedDescription: '잔소리하며 챙기는 관계입니다. 상대방을 위해 많은 신경을 쓰지만 때로는 부담이 될 수 있습니다.',
          color: '#03A9F4', // 따뜻한 색
          lineWidth: 3,
          lineStyle: 'solid',
          source: giverId, // 주는 사람
          target: receiverId, // 받는 사람
          bidirectional: false,
        };
      }
    }
    // 상대방이 나를 생해주는 경우 (생 관계: giver → receiver)
    else {
      // 편인: 나를 생함, 음양 같음
      if (sameYinYang) {
        return {
          level: 2,
          label: '눈빛만 봐도 통함',
          description: `${giverStem}이(가) ${receiverStem}을(를) 생하고 음양이 같아서 눈빛만 봐도 통하는 정신적 지주 관계입니다.`,
          detailedDescription: '눈빛만 봐도 통하는 정신적 지주 관계입니다. 말 없이도 서로를 이해하는 특별한 인연입니다.',
          color: '#FF9800', // 따뜻한 색
          lineWidth: 3,
          lineStyle: 'solid',
          source: giverId, // 주는 사람
          target: receiverId, // 받는 사람
          bidirectional: false,
        };
      }
      // 정인: 나를 생함, 음양 다름
      else {
        return {
          level: 2,
          label: '아낌없이 주는 나무',
          description: `${giverStem}이(가) ${receiverStem}을(를) 생하고 음양이 달라서 아낌없이 주는 엄마 같은 사랑의 관계입니다.`,
          detailedDescription: '아낌없이 주는 엄마 같은 사랑의 관계입니다. 상대방이 나를 위해 많은 것을 베풀어주는 관계입니다.',
          color: '#FFC107', // 따뜻한 색
          lineWidth: 3,
          lineStyle: 'solid',
          source: giverId, // 주는 사람
          target: receiverId, // 받는 사람
          bidirectional: false,
        };
      }
    }
  }
  
  // 상극 관계인 경우 (절대적 방향으로 판단)
  else if (wuxingRel && wuxingRel.type === 'ke') {
    // wuxingRel.source가 wuxingRel.target을 극함
    const isMeWinning = (wuxingRel.source === meWuxing);
    const winnerId = isMeWinning ? meId : youId;
    const loserId = isMeWinning ? youId : meId;
    const winnerStem = isMeWinning ? me : you;
    const loserStem = isMeWinning ? you : me;
    
    // 내가 상대방을 극하는 경우 (극 관계: winner → loser)
    // 이기는 사람(winner) → 지는 사람(loser)
    if (isMeWinning) {
      // 편재: 내가 극함, 음양 같음
      if (sameYinYang) {
        return {
          level: 4,
          label: '집착광공',
          description: `${winnerStem}이(가) ${loserStem}을(를) 극하고 음양이 같아서 내 맘대로 하고 싶은 집착광공 관계입니다.`,
          detailedDescription: '내 맘대로 하고 싶은 집착광공 관계입니다. 상대방을 소유하고 싶은 욕구가 강한 관계입니다.',
          color: '#9C27B0', // 차가운 색
          lineWidth: 3,
          lineStyle: 'solid',
          source: winnerId, // 이기는 사람
          target: loserId, // 지는 사람
          bidirectional: false,
        };
      }
      // 정재: 내가 극함, 음양 다름
      else {
        return {
          level: 4,
          label: '소중한 내꺼',
          description: `${winnerStem}이(가) ${loserStem}을(를) 극하지만 음양이 달라서 아끼고 관리하는 소중한 내꺼 관계입니다.`,
          detailedDescription: '아끼고 관리하는 소중한 내꺼 관계입니다. 상대방을 소중히 여기고 보호하고 싶은 관계입니다.',
          color: '#E91E63', // 차가운 색
          lineWidth: 3,
          lineStyle: 'solid',
          source: winnerId, // 이기는 사람
          target: loserId, // 지는 사람
          bidirectional: false,
        };
      }
    }
    // 상대방이 나를 극하는 경우 (극 관계: winner → loser)
    else {
      // 편관: 나를 극함, 음양 같음
      if (sameYinYang) {
        return {
          level: 4,
          label: '카리스마 조교님',
          description: `${winnerStem}이(가) ${loserStem}을(를) 극하고 음양이 같아서 어렵고 무서운 카리스마 조교님 관계입니다.`,
          detailedDescription: '어렵고 무서운 카리스마 조교님 관계입니다. 상대방이 나를 압박하고 통제하려는 관계입니다.',
          color: '#F44336', // 차가운 색
          lineWidth: 3,
          lineStyle: 'solid',
          source: winnerId, // 이기는 사람
          target: loserId, // 지는 사람
          bidirectional: false,
        };
      }
      // 정관: 나를 극함, 음양 다름
      else {
        return {
          level: 4,
          label: '바른생활 선도부',
          description: `${winnerStem}이(가) ${loserStem}을(를) 극하지만 음양이 달라서 나를 바르게 이끄는 바른생활 선도부 관계입니다.`,
          detailedDescription: '나를 바르게 이끄는 바른생활 선도부 관계입니다. 상대방이 나를 올바른 길로 인도하려는 관계입니다.',
          color: '#E53935', // 차가운 색
          lineWidth: 3,
          lineStyle: 'solid',
          source: winnerId, // 이기는 사람
          target: loserId, // 지는 사람
          bidirectional: false,
        };
      }
    }
  }

  // 그 외의 경우 (기본값) - 양방향
  else {
    return {
      level: 3,
      label: '무난',
      description: `${me}과(와) ${you}는 특별한 십성 관계가 없지만 무난한 관계입니다.`,
      color: '#9E9E9E',
      lineWidth: 2,
      lineStyle: 'solid',
      source: meId,
      target: youId,
      bidirectional: true, // 양방향
    };
  }
}

