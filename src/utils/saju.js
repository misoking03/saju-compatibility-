// 사주 일간 계산 및 궁합 분석 유틸리티

// 천간 배열 (10개)
const TIANGAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
// 천간 오행 (0: 목, 1: 화, 2: 토, 3: 금, 4: 수)
const TIANGAN_WUXING = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
// 천간 음양 (true: 양, false: 음)
// 양: 갑(0), 병(2), 무(4), 경(6), 임(8)
// 음: 을(1), 정(3), 기(5), 신(7), 계(9)
const TIANGAN_YINYANG = [true, false, true, false, true, false, true, false, true, false];

// 지지 배열 (12개)
const JIJI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
// 지지 오행 (0: 목, 1: 화, 2: 토, 3: 금, 4: 수)
// 자수, 축토, 인목, 묘목, 진토, 사화, 오화, 미토, 신금, 유금, 술토, 해수
const JIJI_WUXING = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];

// 가중치 상수 (범용 인간관계 모델)
const WEIGHTS = {
  month_branch: 4.0,  // 월지 (계절/환경으로 가장 중요)
  day_branch: 2.0,    // 일지 (배우자궁)
  hour_branch: 1.5,   // 시지
  year_branch: 1.0,   // 년지
  stem: 1.0,          // 모든 천간 (일간 포함)
};

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
 * @returns {string} 일간 (예: '갑자' - 천간+지지)
 */
export function calculateDayStem(year, month, day) {
  // 기준일: 1900년 1월 1일 = 갑술(甲戌)
  // 천간 인덱스 0 (갑), 지지 인덱스 11 (술)
  const BASE_YEAR = 1900;
  const BASE_MONTH = 1;
  const BASE_DAY = 1;
  const BASE_STEM_INDEX = 0; // 갑
  const BASE_JIJI_INDEX = 11; // 술
  
  // 기준일과 목표일을 생성하고 시간을 00:00:00으로 초기화 (시차 보정)
  const baseDate = new Date(BASE_YEAR, BASE_MONTH - 1, BASE_DAY);
  baseDate.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);
  
  // 총 일수 계산 (밀리초 차이를 일수로 변환)
  const diffTime = targetDate - baseDate;
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // 하루 밀림 보정
  
  // 천간 인덱스 계산: (총 일수 + 기준일 천간 인덱스) % 10
  const stemIndex = (totalDays + BASE_STEM_INDEX) % 10;
  const finalStemIndex = stemIndex >= 0 ? stemIndex : (stemIndex + 10) % 10;
  
  // 지지 인덱스 계산: (총 일수 + 기준일 지지 인덱스 - 1) % 12
  // -1을 하여 지지 인덱스가 +1씩 밀리는 버그 수정
  const jijiIndex = (totalDays + BASE_JIJI_INDEX - 1) % 12;
  const finalJijiIndex = jijiIndex >= 0 ? jijiIndex : (jijiIndex + 12) % 12;
  
  const stem = TIANGAN[finalStemIndex];
  const jiji = JIJI[finalJijiIndex];
  
  // 천간+지지 형식으로 반환 (예: '갑자', '임신', '정해')
  return stem + jiji;
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



// ============================================
// 새로운 범용 인간관계 모델 점수 계산 함수들
// ============================================

/**
 * 연도의 천간지지 계산 (년주)
 * @param {number} year - 연도
 * @returns {object} { stem, branch }
 */
function calculateYearPillar(year) {
  const BASE_YEAR = 1900;
  const BASE_STEM_INDEX = 6; // 경
  const BASE_JIJI_INDEX = 0; // 자
  
  const yearDiff = year - BASE_YEAR;
  const stemIndex = (yearDiff + BASE_STEM_INDEX) % 10;
  const jijiIndex = (yearDiff + BASE_JIJI_INDEX) % 12;
  
  return {
    stem: TIANGAN[stemIndex >= 0 ? stemIndex : (stemIndex + 10) % 10],
    branch: JIJI[jijiIndex >= 0 ? jijiIndex : (jijiIndex + 12) % 12]
  };
}

/**
 * 월의 천간지지 계산 (월주)
 * @param {number} year - 연도
 * @param {number} month - 월 (1-12)
 * @returns {object} { stem, branch }
 */
function calculateMonthPillar(year, month) {
  const BASE_YEAR = 1900;
  const BASE_MONTH = 1;
  const BASE_STEM_INDEX = 3; // 정
  const BASE_JIJI_INDEX = 1; // 축
  
  const yearDiff = year - BASE_YEAR;
  const monthDiff = month - BASE_MONTH;
  const totalMonths = yearDiff * 12 + monthDiff;
  
  const stemIndex = (totalMonths + BASE_STEM_INDEX) % 10;
  const jijiIndex = (totalMonths + BASE_JIJI_INDEX) % 12;
  
  return {
    stem: TIANGAN[stemIndex >= 0 ? stemIndex : (stemIndex + 10) % 10],
    branch: JIJI[jijiIndex >= 0 ? jijiIndex : (jijiIndex + 12) % 12]
  };
}

/**
 * 일의 천간지지 계산 (일주)
 * @param {number} year - 연도
 * @param {number} month - 월 (1-12)
 * @param {number} day - 일
 * @returns {object} { stem, branch }
 */
function calculateDayPillar(year, month, day) {
  const BASE_YEAR = 1900;
  const BASE_MONTH = 1;
  const BASE_DAY = 1;
  const BASE_STEM_INDEX = 0; // 갑
  const BASE_JIJI_INDEX = 11; // 술
  
  const baseDate = new Date(BASE_YEAR, BASE_MONTH - 1, BASE_DAY);
  baseDate.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate - baseDate;
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  const stemIndex = (totalDays + BASE_STEM_INDEX) % 10;
  const jijiIndex = (totalDays + BASE_JIJI_INDEX - 1) % 12; // -1 버그 수정 반영
  
  return {
    stem: TIANGAN[stemIndex >= 0 ? stemIndex : (stemIndex + 10) % 10],
    branch: JIJI[jijiIndex >= 0 ? jijiIndex : (jijiIndex + 12) % 12]
  };
}

/**
 * 시의 천간지지 계산 (시주) - 간단한 방법
 * @param {string} dayStem - 일간 (예: '갑목')
 * @param {number} hour - 시 (0-23)
 * @returns {object} { stem, branch }
 */
function calculateHourPillar(dayStem, hour) {
  // 시지 계산
  const hourToJiji = {
    23: 0, 0: 0, 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 5,
    11: 6, 12: 6, 13: 7, 14: 7, 15: 8, 16: 8, 17: 9, 18: 9, 19: 10, 20: 10, 21: 11, 22: 11
  };
  
  const jijiIndex = hourToJiji[hour] || 0;
  const branch = JIJI[jijiIndex];
  
  // 시간 계산 (일간을 기반으로)
  const dayStemChar = dayStem[0];
  const dayStemIndex = TIANGAN.indexOf(dayStemChar);
  
  // 일간의 천간 인덱스를 기반으로 시간 계산
  const hourStemIndex = (dayStemIndex * 2 + Math.floor(hour / 2)) % 10;
  const stem = TIANGAN[hourStemIndex >= 0 ? hourStemIndex : (hourStemIndex + 10) % 10];
  
  return { stem, branch };
}

/**
 * 사주 8글자 계산
 * @param {number} year - 연도
 * @param {number} month - 월 (1-12)
 * @param {number} day - 일
 * @param {number} hour - 시 (0-23, 기본값 0)
 * @param {boolean} isLunar - 음력 여부
 * @returns {object} 사주 8글자 정보
 */
export function calculateFullSaju(year, month, day, hour = 0, isLunar = false) {
  const yearPillar = calculateYearPillar(year);
  const monthPillar = calculateMonthPillar(year, month);
  const dayPillar = calculateDayPillar(year, month, day);
  const dayStemWithWuxing = dayPillar.stem + ['목', '화', '토', '금', '수'][TIANGAN_WUXING[TIANGAN.indexOf(dayPillar.stem)]];
  const hourPillar = calculateHourPillar(dayStemWithWuxing, hour);
  
  return {
    year_stem: yearPillar.stem,
    year_branch: yearPillar.branch,
    month_stem: monthPillar.stem,
    month_branch: monthPillar.branch,
    day_stem: dayPillar.stem,
    day_branch: dayPillar.branch,
    hour_stem: hourPillar.stem,
    hour_branch: hourPillar.branch,
  };
}

/**
 * 가중치 기반 오행 세력 계산
 * @param {object} sajuData - 사주 8글자 데이터
 * @returns {object} 오행별 총점 {'목': 2.0, '화': 6.5, ...}
 */
function calculateWuxingPower(sajuData) {
  const wuxingPower = { '목': 0.0, '화': 0.0, '토': 0.0, '금': 0.0, '수': 0.0 };
  const wuxingNames = ['목', '화', '토', '금', '수'];
  
  // 년간 (천간)
  const yearStemIndex = TIANGAN.indexOf(sajuData.year_stem);
  if (yearStemIndex !== -1) {
    const wuxing = wuxingNames[TIANGAN_WUXING[yearStemIndex]];
    wuxingPower[wuxing] += WEIGHTS.stem;
  }
  
  // 년지
  const yearBranchIndex = JIJI.indexOf(sajuData.year_branch);
  if (yearBranchIndex !== -1) {
    const wuxing = wuxingNames[JIJI_WUXING[yearBranchIndex]];
    wuxingPower[wuxing] += WEIGHTS.year_branch;
  }
  
  // 월간 (천간)
  const monthStemIndex = TIANGAN.indexOf(sajuData.month_stem);
  if (monthStemIndex !== -1) {
    const wuxing = wuxingNames[TIANGAN_WUXING[monthStemIndex]];
    wuxingPower[wuxing] += WEIGHTS.stem;
  }
  
  // 월지 (가장 높은 가중치)
  const monthBranchIndex = JIJI.indexOf(sajuData.month_branch);
  if (monthBranchIndex !== -1) {
    const wuxing = wuxingNames[JIJI_WUXING[monthBranchIndex]];
    wuxingPower[wuxing] += WEIGHTS.month_branch;
  }
  
  // 일간 (천간)
  const dayStemIndex = TIANGAN.indexOf(sajuData.day_stem);
  if (dayStemIndex !== -1) {
    const wuxing = wuxingNames[TIANGAN_WUXING[dayStemIndex]];
    wuxingPower[wuxing] += WEIGHTS.stem;
  }
  
  // 일지
  const dayBranchIndex = JIJI.indexOf(sajuData.day_branch);
  if (dayBranchIndex !== -1) {
    const wuxing = wuxingNames[JIJI_WUXING[dayBranchIndex]];
    wuxingPower[wuxing] += WEIGHTS.day_branch;
  }
  
  // 시간 (천간)
  const hourStemIndex = TIANGAN.indexOf(sajuData.hour_stem);
  if (hourStemIndex !== -1) {
    const wuxing = wuxingNames[TIANGAN_WUXING[hourStemIndex]];
    wuxingPower[wuxing] += WEIGHTS.stem;
  }
  
  // 시지
  const hourBranchIndex = JIJI.indexOf(sajuData.hour_branch);
  if (hourBranchIndex !== -1) {
    const wuxing = wuxingNames[JIJI_WUXING[hourBranchIndex]];
    wuxingPower[wuxing] += WEIGHTS.hour_branch;
  }
  
  return wuxingPower;
}

/**
 * 오행 상호보완 점수 계산 (Max 40점)
 * @param {object} userAPower - User A의 오행 세력
 * @param {object} userBPower - User B의 오행 세력
 * @returns {object} { score, details }
 */
function calculateComplementarityScore(userAPower, userBPower) {
  let score = 0;
  const details = [];
  
  // User A의 가장 약한 오행(결핍) 찾기
  const aMinWuxing = Object.entries(userAPower).reduce((min, [wuxing, power]) => 
    power < min[1] ? [wuxing, power] : min, 
    ['목', Infinity]
  );
  
  const [minWuxingName, minWuxingValue] = aMinWuxing;
  
  // User B가 A의 결핍 오행을 보완하는지 확인
  const bMinWuxingPower = userBPower[minWuxingName] || 0.0;
  
  if (bMinWuxingPower >= 4.0) {  // 월지급 세력
    score += 40;
    details.push(`상대가 내 결핍 오행(${minWuxingName})을 월지급 세력(${bMinWuxingPower.toFixed(1)}점)으로 보완 - 최상의 시너지: +40점`);
  } else if (bMinWuxingPower >= 2.0) {  // 적당한 세력
    score += 20;
    details.push(`상대가 내 결핍 오행(${minWuxingName})을 적당한 세력(${bMinWuxingPower.toFixed(1)}점)으로 보완 - 좋은 팀워크: +20점`);
  }
  
  return { score, details };
}

/**
 * 천간합 확인
 * @param {string} stemA - 천간 A
 * @param {string} stemB - 천간 B
 * @returns {boolean}
 */
function checkTianganHe(stemA, stemB) {
  const hePairs = [
    ['갑', '기'], ['기', '갑'],
    ['을', '경'], ['경', '을'],
    ['병', '신'], ['신', '병'],
    ['정', '임'], ['임', '정'],
    ['무', '계'], ['계', '무'],
  ];
  return hePairs.some(([a, b]) => a === stemA && b === stemB);
}

/**
 * 천간충 확인
 * @param {string} stemA - 천간 A
 * @param {string} stemB - 천간 B
 * @returns {boolean}
 */
function checkTianganChong(stemA, stemB) {
  const chongPairs = [
    ['갑', '경'], ['경', '갑'],
    ['을', '신'], ['신', '을'],
    ['병', '임'], ['임', '병'],
    ['정', '계'], ['계', '정'],
  ];
  return chongPairs.some(([a, b]) => a === stemA && b === stemB);
}

/**
 * 육합 확인
 * @param {string} branchA - 지지 A
 * @param {string} branchB - 지지 B
 * @returns {boolean}
 */
function checkJijiLiuhe(branchA, branchB) {
  const liuhePairs = [
    ['자', '축'], ['축', '자'],
    ['인', '해'], ['해', '인'],
    ['묘', '술'], ['술', '묘'],
    ['진', '유'], ['유', '진'],
    ['사', '신'], ['신', '사'],
    ['오', '미'], ['미', '오'],
  ];
  return liuhePairs.some(([a, b]) => a === branchA && b === branchB);
}

/**
 * 삼합 확인
 * @param {string} branchA - 지지 A
 * @param {string} branchB - 지지 B
 * @returns {boolean}
 */
function checkJijiSanhe(branchA, branchB) {
  const sanheGroups = [
    ['인', '오', '술'],
    ['사', '유', '축'],
    ['해', '묘', '미'],
    ['자', '진', '신'],
  ];
  return sanheGroups.some(group => group.includes(branchA) && group.includes(branchB));
}

/**
 * 지지충 확인
 * @param {string} branchA - 지지 A
 * @param {string} branchB - 지지 B
 * @returns {boolean}
 */
function checkJijiChong(branchA, branchB) {
  const chongPairs = [
    ['자', '오'], ['오', '자'],
    ['축', '미'], ['미', '축'],
    ['인', '신'], ['신', '인'],
    ['묘', '유'], ['유', '묘'],
    ['진', '술'], ['술', '진'],
    ['사', '해'], ['해', '사'],
  ];
  return chongPairs.some(([a, b]) => a === branchA && b === branchB);
}

/**
 * 원진살 확인
 * @param {string} branchA - 지지 A
 * @param {string} branchB - 지지 B
 * @returns {boolean}
 */
function checkJijiYuanjin(branchA, branchB) {
  const yuanjinPairs = [
    ['자', '묘'], ['묘', '자'],
    ['축', '진'], ['진', '축'],
    ['인', '사'], ['사', '인'],
    ['오', '유'], ['유', '오'],
    ['신', '해'], ['해', '신'],
    ['미', '술'], ['술', '미'],
  ];
  return yuanjinPairs.some(([a, b]) => a === branchA && b === branchB);
}

/**
 * 귀문관살 확인
 * @param {string} branchA - 지지 A
 * @param {string} branchB - 지지 B
 * @returns {boolean}
 */
function checkJijiGuimun(branchA, branchB) {
  const guimunPairs = [
    ['자', '해'], ['해', '자'],
    ['축', '미'], ['미', '축'],
    ['인', '신'], ['신', '인'],
    ['묘', '유'], ['유', '묘'],
    ['진', '술'], ['술', '진'],
    ['사', '오'], ['오', '사'],
  ];
  return guimunPairs.some(([a, b]) => a === branchA && b === branchB);
}

/**
 * 일주 매칭 점수 계산 (Max 20점: 천간 10점 + 지지 10점)
 * @param {object} userASaju - User A의 사주 데이터
 * @param {object} userBSaju - User B의 사주 데이터
 * @returns {object} { score, details }
 */
function calculateDayPillarMatching(userASaju, userBSaju) {
  let score = 0;
  const details = [];
  
  const aDayStem = userASaju.day_stem;
  const aDayBranch = userASaju.day_branch;
  const bDayStem = userBSaju.day_stem;
  const bDayBranch = userBSaju.day_branch;
  
  // 천간 분석 - 가치관/소통 (Max 10점)
  if (checkTianganHe(aDayStem, bDayStem)) {
    score += 10;
    details.push(`천간합 (${aDayStem}-${bDayStem}) - 업무 합이 잘 맞음: +10점`);
  }
  
  if (checkTianganChong(aDayStem, bDayStem)) {
    score -= 5;
    details.push(`천간충 (${aDayStem}-${bDayStem}) - 의견 조율이 필요함: -5점`);
  }
  
  // 지지 분석 - 성격/스타일 (Max 10점)
  if (checkJijiLiuhe(aDayBranch, bDayBranch)) {
    score += 10;
    details.push(`육합 (${aDayBranch}-${bDayBranch}) - 팀워크가 좋음: +10점`);
  }
  
  if (checkJijiSanhe(aDayBranch, bDayBranch)) {
    score += 10;
    details.push(`삼합 (${aDayBranch}-${bDayBranch}) - 팀워크가 좋음: +10점`);
  }
  
  if (checkJijiChong(aDayBranch, bDayBranch)) {
    score -= 5;
    details.push(`지지충 (${aDayBranch}-${bDayBranch}) - 성격 차이, 적당한 거리 유지 필요: -5점`);
  }
  
  if (checkJijiYuanjin(aDayBranch, bDayBranch)) {
    score -= 5;
    details.push(`원진살 (${aDayBranch}-${bDayBranch}) - 소통 시 주의 필요: -5점`);
  }
  
  if (checkJijiGuimun(aDayBranch, bDayBranch)) {
    score -= 5;
    details.push(`귀문관살 (${aDayBranch}-${bDayBranch}) - 소통 시 주의 필요: -5점`);
  }
  
  return { score, details };
}

/**
 * 점수에 따른 파트너십 라벨 생성 (심플한 버전)
 * @param {number} score - 종합 점수 (0-100)
 * @returns {string} 라벨 텍스트
 */
export function getCompatibilityLabel(score) {
  if (score >= 80) {
    return '최상';
  } else if (score >= 60) {
    return '좋음';
  } else if (score >= 40) {
    return '보통';
  } else if (score >= 20) {
    return '주의';
  } else {
    return '조율';
  }
}

/**
 * 점수에 따른 스타일 정보 생성
 * @param {number} score - 종합 점수 (0-100)
 * @returns {object} 스타일 정보 { color, lineWidth, lineStyle, level }
 */
export function getCompatibilityStyle(score) {
  if (score >= 80) {
    return {
      color: '#4CAF50', // 초록색
      lineWidth: 4,
      lineStyle: 'solid',
      level: 1,
    };
  } else if (score >= 60) {
    return {
      color: '#8BC34A', // 연한 초록색
      lineWidth: 3,
      lineStyle: 'solid',
      level: 2,
    };
  } else if (score >= 40) {
    return {
      color: '#FFA500', // 주황색
      lineWidth: 2,
      lineStyle: 'solid',
      level: 3,
    };
  } else if (score >= 20) {
    return {
      color: '#FF9800', // 진한 주황색
      lineWidth: 2,
      lineStyle: 'dashed',
      level: 4,
    };
  } else {
    return {
      color: '#F44336', // 빨간색
      lineWidth: 2,
      lineStyle: 'dashed',
      level: 5,
    };
  }
}

/**
 * 범용 인간관계 모델 기반 종합 점수 계산
 * @param {object} userASaju - User A의 사주 8글자 데이터
 * @param {object} userBSaju - User B의 사주 8글자 데이터
 * @returns {object} 종합 분석 결과
 */
export function calculateCompatibilityScore(userASaju, userBSaju) {
  // 기본 점수 40점
  const baseScore = 40;
  
  // 1단계: 오행 세력 계산
  const userAPower = calculateWuxingPower(userASaju);
  const userBPower = calculateWuxingPower(userBSaju);
  
  // 2단계: 오행 상호보완 점수 (Max 40점)
  const complementarity = calculateComplementarityScore(userAPower, userBPower);
  
  // 3단계: 일주 매칭 점수 (Max 20점)
  const dayPillarMatching = calculateDayPillarMatching(userASaju, userBSaju);
  
  // 최종 점수 계산
  let finalScore = baseScore + complementarity.score + dayPillarMatching.score;
  
  // 점수 제한 (0~100)
  finalScore = Math.max(0, Math.min(100, finalScore));
  
  return {
    score: finalScore,
    maxScore: 100,
    minScore: 0,
    baseScore,
    complementarityScore: complementarity.score,
    dayPillarScore: dayPillarMatching.score,
    details: {
      complementarity: {
        score: complementarity.score,
        details: complementarity.details
      },
      dayPillar: {
        score: dayPillarMatching.score,
        details: dayPillarMatching.details
      }
    },
    wuxingPower: {
      userA: userAPower,
      userB: userBPower
    }
  };
}

