// 사주 일간 계산 및 궁합 분석 유틸리티

// 관계 태그 (점수 외에 관계 식별용)
export const RELATION_TAGS = {
  SAME_STEM: 'SAME_STEM',           // 같은 일간 (비견)
  TIANGAN_HE: 'TIANGAN_HE',         // 천간합
  TIANGAN_CHONG: 'TIANGAN_CHONG',   // 천간충
  JIJI_HE: 'JIJI_HE',               // 지지 육합/삼합
  JIJI_CHONG: 'JIJI_CHONG',         // 지지충/원진/귀문
  COMPLEMENTARY: 'COMPLEMENTARY',   // 오행 상호보완
  SOCIAL_HE: 'SOCIAL_HE',           // 월지 합/삼합
  SOCIAL_CHONG: 'SOCIAL_CHONG',     // 월지 충/원진/귀문
  SIMILAR_WUXING: 'SIMILAR_WUXING', // 오행 분포 유사
  SAME_STRONG_WUXING: 'SAME_STRONG_WUXING', // 같은 오행 과다
};

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
 * 시의 천간지지 계산 (시주) - 정확한 시간 구분 적용
 * @param {string} dayStem - 일간 (예: '갑목')
 * @param {number} hour - 시 (0-23)
 * @param {number} minute - 분 (0-59, 기본값 0)
 * @returns {object} { stem, branch }
 */
function calculateHourPillar(dayStem, hour, minute = 0) {
  // 정확한 시간 구분 (표 기준: 30분 단위)
  // 자(子): 23:30 ~ 01:29, 축(丑): 01:30 ~ 03:29, 인(寅): 03:30 ~ 05:29, ...
  let jijiIndex = 0;
  
  // 시간과 분을 고려한 정확한 지지 계산
  const totalMinutes = hour * 60 + minute;
  
  if ((totalMinutes >= 23 * 60 + 30) || (totalMinutes < 1 * 60 + 30)) {
    jijiIndex = 0; // 자(子): 23:30 ~ 01:29
  } else if (totalMinutes >= 1 * 60 + 30 && totalMinutes < 3 * 60 + 30) {
    jijiIndex = 1; // 축(丑): 01:30 ~ 03:29
  } else if (totalMinutes >= 3 * 60 + 30 && totalMinutes < 5 * 60 + 30) {
    jijiIndex = 2; // 인(寅): 03:30 ~ 05:29
  } else if (totalMinutes >= 5 * 60 + 30 && totalMinutes < 7 * 60 + 30) {
    jijiIndex = 3; // 묘(卯): 05:30 ~ 07:29
  } else if (totalMinutes >= 7 * 60 + 30 && totalMinutes < 9 * 60 + 30) {
    jijiIndex = 4; // 진(辰): 07:30 ~ 09:29
  } else if (totalMinutes >= 9 * 60 + 30 && totalMinutes < 11 * 60 + 30) {
    jijiIndex = 5; // 사(巳): 09:30 ~ 11:29
  } else if (totalMinutes >= 11 * 60 + 30 && totalMinutes < 13 * 60 + 30) {
    jijiIndex = 6; // 오(午): 11:30 ~ 13:29
  } else if (totalMinutes >= 13 * 60 + 30 && totalMinutes < 15 * 60 + 30) {
    jijiIndex = 7; // 미(未): 13:30 ~ 15:29
  } else if (totalMinutes >= 15 * 60 + 30 && totalMinutes < 17 * 60 + 30) {
    jijiIndex = 8; // 신(申): 15:30 ~ 17:29
  } else if (totalMinutes >= 17 * 60 + 30 && totalMinutes < 19 * 60 + 30) {
    jijiIndex = 9; // 유(酉): 17:30 ~ 19:29
  } else if (totalMinutes >= 19 * 60 + 30 && totalMinutes < 21 * 60 + 30) {
    jijiIndex = 10; // 술(戌): 19:30 ~ 21:29
  } else if (totalMinutes >= 21 * 60 + 30 && totalMinutes < 23 * 60 + 30) {
    jijiIndex = 11; // 해(亥): 21:30 ~ 23:29
  }
  
  const branch = JIJI[jijiIndex];
  
  // 시간 천간 계산 (일간을 기준으로 - 정확한 공식)
  const dayStemChar = dayStem[0];
  const dayStemIndex = TIANGAN.indexOf(dayStemChar);
  
  // 일간을 기준으로 시작 천간 결정 (5개의 쌍으로 묶임)
  // 갑(0)과 기(5): 갑으로 시작
  // 을(1)과 경(6): 병으로 시작
  // 병(2)과 신(7): 무로 시작
  // 정(3)과 임(8): 경으로 시작
  // 무(4)와 계(9): 임으로 시작
  let startStemIndex = 0;
  if (dayStemIndex === 0 || dayStemIndex === 5) {
    // 갑(0)과 기(5): 갑으로 시작
    startStemIndex = 0; // 갑
  } else if (dayStemIndex === 1 || dayStemIndex === 6) {
    // 을(1)과 경(6): 병으로 시작
    startStemIndex = 2; // 병
  } else if (dayStemIndex === 2 || dayStemIndex === 7) {
    // 병(2)과 신(7): 무로 시작
    startStemIndex = 4; // 무
  } else if (dayStemIndex === 3 || dayStemIndex === 8) {
    // 정(3)과 임(8): 경으로 시작
    startStemIndex = 6; // 경
  } else if (dayStemIndex === 4 || dayStemIndex === 9) {
    // 무(4)와 계(9): 임으로 시작
    startStemIndex = 8; // 임
  }
  
  // 자시부터 시작해서 각 시간대마다 천간이 순환
  // 자시(0): 시작 천간, 축시(1): 시작 천간 + 1, 인시(2): 시작 천간 + 2, ...
  const hourStemIndex = (startStemIndex + jijiIndex) % 10;
  const stem = TIANGAN[hourStemIndex >= 0 ? hourStemIndex : (hourStemIndex + 10) % 10];
  
  return { stem, branch };
}

/**
 * 사주 8글자 계산
 * @param {number} year - 연도
 * @param {number} month - 월 (1-12)
 * @param {number} day - 일
 * @param {number|null} hour - 시 (0-23, null이면 시주 제외)
 * @param {number|null} minute - 분 (0-59, 기본값 0)
 * @param {boolean} isLunar - 음력 여부
 * @returns {object} 사주 8글자 정보 (hour가 null이면 hour_stem, hour_branch도 null)
 */
export function calculateFullSaju(year, month, day, hour = null, minute = 0, isLunar = false) {
  const yearPillar = calculateYearPillar(year);
  const monthPillar = calculateMonthPillar(year, month);
  const dayPillar = calculateDayPillar(year, month, day);
  
  let hour_stem = null;
  let hour_branch = null;
  
  if (hour !== null && hour !== undefined) {
    const dayStemWithWuxing = dayPillar.stem + ['목', '화', '토', '금', '수'][TIANGAN_WUXING[TIANGAN.indexOf(dayPillar.stem)]];
    const finalMinute = minute !== null && minute !== undefined ? minute : 0;
    const hourPillar = calculateHourPillar(dayStemWithWuxing, hour, finalMinute);
    hour_stem = hourPillar.stem;
    hour_branch = hourPillar.branch;
  }
  
  return {
    year_stem: yearPillar.stem,
    year_branch: yearPillar.branch,
    month_stem: monthPillar.stem,
    month_branch: monthPillar.branch,
    day_stem: dayPillar.stem,
    day_branch: dayPillar.branch,
    hour_stem,
    hour_branch,
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
  
  // 시간 (천간) - 시주가 있는 경우만 계산
  if (sajuData.hour_stem !== null && sajuData.hour_stem !== undefined) {
    const hourStemIndex = TIANGAN.indexOf(sajuData.hour_stem);
    if (hourStemIndex !== -1) {
      const wuxing = wuxingNames[TIANGAN_WUXING[hourStemIndex]];
      wuxingPower[wuxing] += WEIGHTS.stem;
    }
  }
  
  // 시지 - 시주가 있는 경우만 계산
  if (sajuData.hour_branch !== null && sajuData.hour_branch !== undefined) {
    const hourBranchIndex = JIJI.indexOf(sajuData.hour_branch);
    if (hourBranchIndex !== -1) {
      const wuxing = wuxingNames[JIJI_WUXING[hourBranchIndex]];
      wuxingPower[wuxing] += WEIGHTS.hour_branch;
    }
  }
  
  // 시주 디버깅 정보 출력
  if (sajuData.hour_stem || sajuData.hour_branch) {
    console.log(`[오행 세력] 시주 포함: ${sajuData.hour_stem}${sajuData.hour_branch}`, {
      시주가중치: {
        hour_stem: WEIGHTS.stem,
        hour_branch: WEIGHTS.hour_branch
      },
      오행세력: wuxingPower
    });
  } else {
    console.log(`[오행 세력] 시주 없음 (6글자만 계산)`, {
      오행세력: wuxingPower
    });
  }
  
  return wuxingPower;
}

/**
 * 오행 분포 유사도 계산
 * 두 사람의 오행 세력 분포가 얼마나 유사한지 계산 (0-1, 1에 가까울수록 유사)
 * @param {object} userAPower - User A의 오행 세력
 * @param {object} userBPower - User B의 오행 세력
 * @returns {number} 유사도 (0-1)
 */
function calculateWuxingSimilarity(userAPower, userBPower) {
  const wuxingNames = ['목', '화', '토', '금', '수'];
  
  // 각 오행의 세력을 배열로 변환
  const aPowers = wuxingNames.map(w => userAPower[w] || 0);
  const bPowers = wuxingNames.map(w => userBPower[w] || 0);
  
  // 총합 계산
  const aTotal = aPowers.reduce((sum, p) => sum + p, 0);
  const bTotal = bPowers.reduce((sum, p) => sum + p, 0);
  
  // 총합이 0이면 유사도 0
  if (aTotal === 0 || bTotal === 0) return 0;
  
  // 정규화 (비율로 변환)
  const aNormalized = aPowers.map(p => p / aTotal);
  const bNormalized = bPowers.map(p => p / bTotal);
  
  // 코사인 유사도 계산
  let dotProduct = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;
  
  for (let i = 0; i < wuxingNames.length; i++) {
    dotProduct += aNormalized[i] * bNormalized[i];
    aMagnitude += aNormalized[i] * aNormalized[i];
    bMagnitude += bNormalized[i] * bNormalized[i];
  }
  
  const similarity = dotProduct / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
  return similarity;
}

/**
 * 오행 상호보완 점수 계산 (Max 35점)
 * 스스로 보완 가능 여부를 확인하고, 불가능할 때만 상대방이 보완하는지 확인
 * @param {object} userAPower - User A의 오행 세력
 * @param {object} userBPower - User B의 오행 세력
 * @returns {object} { score, details }
 */
function calculateComplementarityScore(userAPower, userBPower) {
  let score = 0;
  const details = [];
  const tags = [];
  
  const wuxingNames = ['목', '화', '토', '금', '수'];
  const wuxingToIndex = { '목': 0, '화': 1, '토': 2, '금': 3, '수': 4 };
  
  // User A의 가장 약한 오행(결핍) 찾기
  const aMinWuxing = Object.entries(userAPower).reduce((min, [wuxing, power]) => 
    power < min[1] ? [wuxing, power] : min, 
    ['목', Infinity]
  );
  
  const [minWuxingName, minWuxingValue] = aMinWuxing;
  const minWuxingIndex = wuxingToIndex[minWuxingName];
  
  // User A가 스스로 보완 가능한지 확인
  const shengWuxingIndex = WUXING_SHENG[minWuxingIndex];
  const shengWuxingName = wuxingNames[shengWuxingIndex];
  const aShengWuxingPower = userAPower[shengWuxingName] || 0.0;
  
  // 오행이 아예 0이면 스스로 보완 가능해도 부족으로 간주
  // 오행이 약간 있지만 부족하면, 스스로 보완 가능하면 상대방에게서 찾을 필요 없음
  let aScore = 0;
  if (minWuxingValue === 0 || aShengWuxingPower < 4.0) {
    // 스스로 보완 불가능하므로 상대방이 보완해주는지 확인
    const bMinWuxingPower = userBPower[minWuxingName] || 0.0;
    
    if (bMinWuxingPower >= 4.0) {  // 강한 세력
      aScore = 18;  // 한 방향 최대 18점
      details.push(`상대가 내 결핍 오행(${minWuxingName})을 강하게 보완해 줘요`);
      tags.push(RELATION_TAGS.COMPLEMENTARY);
    } else if (bMinWuxingPower >= 2.0) {  // 적당한 세력
      aScore = 10;   // 한 방향 최대 10점
      details.push(`상대가 내 결핍 오행(${minWuxingName})을 꽤 잘 보완해 줘요`);
      tags.push(RELATION_TAGS.COMPLEMENTARY);
    }
  }
  // 스스로 보완 가능하면 (생성하는 오행을 강하게 가지고 있고, 부족한 오행이 0이 아니면) 점수 없음
  
  // 반대 방향도 확인 (User B의 부족한 오행을 User A가 보완하는지)
  const bMinWuxing = Object.entries(userBPower).reduce((min, [wuxing, power]) => 
    power < min[1] ? [wuxing, power] : min, 
    ['목', Infinity]
  );
  
  const [bMinWuxingName, bMinWuxingValue] = bMinWuxing;
  const bMinWuxingIndex = wuxingToIndex[bMinWuxingName];
  
  // User B가 스스로 보완 가능한지 확인
  const bShengWuxingIndex = WUXING_SHENG[bMinWuxingIndex];
  const bShengWuxingName = wuxingNames[bShengWuxingIndex];
  const bShengWuxingPower = userBPower[bShengWuxingName] || 0.0;
  
  // 오행이 아예 0이면 스스로 보완 가능해도 부족으로 간주
  // 오행이 약간 있지만 부족하면, 스스로 보완 가능하면 상대방에게서 찾을 필요 없음
  let bScore = 0;
  if (bMinWuxingValue === 0 || bShengWuxingPower < 4.0) {
    // 스스로 보완 불가능하므로 상대방이 보완해주는지 확인
    const aMinWuxingPower = userAPower[bMinWuxingName] || 0.0;
    
    if (aMinWuxingPower >= 4.0) {  // 강한 세력
      bScore = 18;  // 한 방향 최대 18점
      details.push(`내가 상대의 결핍 오행(${bMinWuxingName})을 강하게 보완해 줘요`);
      tags.push(RELATION_TAGS.COMPLEMENTARY);
    } else if (aMinWuxingPower >= 2.0) {  // 적당한 세력
      bScore = 10;   // 한 방향 최대 10점
      details.push(`내가 상대의 결핍 오행(${bMinWuxingName})을 꽤 잘 보완해 줘요`);
      tags.push(RELATION_TAGS.COMPLEMENTARY);
    }
  }
  // 스스로 보완 가능하면 점수 없음
  
  // 양방향 점수를 합산하되 최대 35점으로 제한
  score = Math.min(35, aScore + bScore);
  
  // 둘 다 같은 오행이 강한 경우 확인 (점수에는 반영하지 않고 텍스트/태그용)
  wuxingNames.forEach(wuxing => {
    const aPower = userAPower[wuxing] || 0;
    const bPower = userBPower[wuxing] || 0;
    
    // 둘 다 4.0 이상이면 같은 오행이 강함 (월지급 세력)
    if (aPower >= 4.0 && bPower >= 4.0) {
      const wuxingNames = ['목', '화', '토', '금', '수'];
      details.push(`둘 다 ${wuxing} 기운이 강해서 서로 비슷한 강점을 가져요`);
      tags.push(RELATION_TAGS.SAME_STRONG_WUXING);
    }
  });
  
  return { score, details, tags };
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
 * 일간/일지 매칭 점수 계산
 * Mental Chemistry: 일간 천간 (Max 20점: 합 +20, 충 -5)
 * Lifestyle Chemistry: 일지 (Max 15점: 육합 +8, 삼합 +7, 충/원진/귀문 -5)
 */
function calculateDayPillarMatching(userASaju, userBSaju) {
  let stemScore = 0;
  let branchScore = 0;
  const details = [];
  const tags = [];
  
  const aDayStem = userASaju.day_stem;
  const aDayBranch = userASaju.day_branch;
  const bDayStem = userBSaju.day_stem;
  const bDayBranch = userBSaju.day_branch;
  
  // Mental Chemistry: 일간
  if (checkTianganHe(aDayStem, bDayStem)) {
    stemScore += 20;
    details.push(`천간합 (${aDayStem}-${bDayStem}) - 가치관이 조화를 이루어서 말 한마디로 통하는 사이예요`);
    tags.push(RELATION_TAGS.TIANGAN_HE);
  }
  if (checkTianganChong(aDayStem, bDayStem)) {
    stemScore -= 3; // 완화
    details.push(`천간충 (${aDayStem}-${bDayStem}) - 생각하는 방식이 달라서 가끔 의견이 엇갈릴 수 있어요`);
    tags.push(RELATION_TAGS.TIANGAN_CHONG);
  }
  
  // Lifestyle Chemistry: 일지
  if (checkJijiLiuhe(aDayBranch, bDayBranch)) {
    branchScore += 8; // 육합
    details.push(`육합 (${aDayBranch}-${bDayBranch}) - 성격이 찰떡같이 맞아서 함께 있으면 편안하고 좋아요`);
    tags.push(RELATION_TAGS.JIJI_HE);
  }
  if (checkJijiSanhe(aDayBranch, bDayBranch)) {
    branchScore += 7; // 삼합
    details.push(`삼합 (${aDayBranch}-${bDayBranch}) - 같이 있으면 호흡이 자연스럽게 맞아서 편안해요`);
    tags.push(RELATION_TAGS.JIJI_HE);
  }
  if (checkJijiChong(aDayBranch, bDayBranch)) {
    branchScore -= 3; // 완화
    details.push(`지지충 (${aDayBranch}-${bDayBranch}) - 성격이 달라서 가끔 마찰이 생길 수 있지만, 적당한 거리를 두면 오히려 좋아요`);
    tags.push(RELATION_TAGS.JIJI_CHONG);
  }
  if (checkJijiYuanjin(aDayBranch, bDayBranch)) {
    branchScore -= 3; // 완화
    details.push(`원진살 (${aDayBranch}-${bDayBranch}) - 표현 방식이 달라서 작은 말 한마디가 예민하게 느껴질 수 있어요`);
    tags.push(RELATION_TAGS.JIJI_CHONG);
  }
  if (checkJijiGuimun(aDayBranch, bDayBranch)) {
    branchScore -= 3; // 완화
    details.push(`귀문관살 (${aDayBranch}-${bDayBranch}) - 서로 마음 읽기가 어려워서 가끔 오해가 생길 수 있어요`);
    tags.push(RELATION_TAGS.JIJI_CHONG);
  }
  
  // 같은 일간(비견) 태그 (점수는 Mental에 포함하지 않고 태그/텍스트용)
  if (aDayStem === bDayStem) {
    details.push(`비견 (${aDayStem}) - 서로 비슷한 특성을 가져서 눈빛만 봐도 알 수 있는 사이예요`);
    tags.push(RELATION_TAGS.SAME_STEM);
  }
  
  const score = stemScore + branchScore;
  return { score, stemScore, branchScore, details, tags };
}

/**
 * 월지 기반 Social Chemistry 점수 (Max 15점)
 * 합/삼합: 육합 +8, 삼합 +7
 * 충/원진/귀문: -5
 */
function calculateMonthBranchMatching(userASaju, userBSaju) {
  let branchScore = 0;
  const details = [];
  const tags = [];
  
  const aMonthBranch = userASaju.month_branch;
  const bMonthBranch = userBSaju.month_branch;
  
  if (checkJijiLiuhe(aMonthBranch, bMonthBranch)) {
    branchScore += 8;
    details.push(`월지 육합 (${aMonthBranch}-${bMonthBranch}) - 팀으로 일할 때 호흡이 잘 맞아서 시너지가 나요`);
    tags.push(RELATION_TAGS.SOCIAL_HE);
  }
  if (checkJijiSanhe(aMonthBranch, bMonthBranch)) {
    branchScore += 7;
    details.push(`월지 삼합 (${aMonthBranch}-${bMonthBranch}) - 조직 내에서 자연스럽게 케미가 맞아요`);
    tags.push(RELATION_TAGS.SOCIAL_HE);
  }
  if (checkJijiChong(aMonthBranch, bMonthBranch)) {
    branchScore -= 3; // 완화
    details.push(`월지 충 (${aMonthBranch}-${bMonthBranch}) - 사회적 역할에서 가끔 충돌이 있을 수 있어요`);
    tags.push(RELATION_TAGS.SOCIAL_CHONG);
  }
  if (checkJijiYuanjin(aMonthBranch, bMonthBranch)) {
    branchScore -= 3; // 완화
    details.push(`월지 원진 (${aMonthBranch}-${bMonthBranch}) - 사회적 관계에서 예민해질 수 있어서 톤 조절이 필요해요`);
    tags.push(RELATION_TAGS.SOCIAL_CHONG);
  }
  if (checkJijiGuimun(aMonthBranch, bMonthBranch)) {
    branchScore -= 3; // 완화
    details.push(`월지 귀문 (${aMonthBranch}-${bMonthBranch}) - 팀 협업할 때 서로의 의도를 파악하기 어려울 수 있어요`);
    tags.push(RELATION_TAGS.SOCIAL_CHONG);
  }
  
  return { score: branchScore, details, tags };
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
 * 점수에 따른 스타일 정보 생성 (새로운 레벨 기준 반영)
 * @param {number} score - 종합 점수 (0-100)
 * @returns {object} 스타일 정보 { color, lineWidth, lineStyle, level }
 */
export function getCompatibilityStyle(score) {
  if (score >= 75) {
    // excellent: 75점 이상
        return {
      color: '#4CAF50', // 초록색
      lineWidth: 4,
          lineStyle: 'solid',
      level: 1,
        };
  } else if (score >= 55) {
    // good: 55점 이상
        return {
      color: '#66BB6A', // 밝은 초록색
          lineWidth: 3,
          lineStyle: 'solid',
      level: 2,
    };
  } else if (score >= 40) {
    // normal: 40점 이상 (중립적인 컬러)
    return {
      color: '#9E9E9E', // 회색 (중립)
      lineWidth: 2,
      lineStyle: 'solid',
      level: 3,
    };
  } else if (score >= 25) {
    // caution: 25점 이상
    return {
      color: '#FF9800', // 주황색
      lineWidth: 2,
      lineStyle: 'dashed',
      level: 4,
    };
  } else {
    // adjustment: 25점 미만
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
  // 기본 점수 30점
  const baseScore = 30;
  
  // 1단계: 오행 세력 계산
  const userAPower = calculateWuxingPower(userASaju);
  const userBPower = calculateWuxingPower(userBSaju);
  
  // 오행 분포 유사도 계산
  const wuxingSimilarity = calculateWuxingSimilarity(userAPower, userBPower);
  const isSimilarWuxing = wuxingSimilarity >= 0.75; // 75% 이상 유사하면 유사하다고 판단
  
  // 2단계: Mutual Complementarity (Max 35점)
  const complementarity = calculateComplementarityScore(userAPower, userBPower);
  
  // 3단계: Mental/Lifestyle (일간/일지)
  const dayPillarMatching = calculateDayPillarMatching(userASaju, userBSaju);
  const mentalScore = dayPillarMatching.stemScore;      // Max 20
  const lifestyleScore = dayPillarMatching.branchScore; // Max 15
  
  // 4단계: Social (월지)
  const monthMatching = calculateMonthBranchMatching(userASaju, userBSaju); // Max 15
  const socialScore = monthMatching.score;
  
  // 최종 점수 계산 (기본 32 + 상호보완 35 + Mental 20 + Lifestyle 15 + Social 15 = 117 → 100으로 캡)
  const baseScoreAdjusted = 32;
  let finalScore = baseScoreAdjusted + complementarity.score + mentalScore + lifestyleScore + socialScore;
  
  // 점수 제한 (0~100)
  finalScore = Math.max(0, Math.min(100, finalScore));
  
  // 레벨 정보 추가
  let level = 'normal';
  if (finalScore >= 75) level = 'excellent';
  else if (finalScore >= 55) level = 'good';
  else if (finalScore >= 40) level = 'normal';
  else if (finalScore >= 25) level = 'caution';
  else level = 'adjustment';
  
  // 관계 태그
  const allTags = [
    ...(complementarity.tags || []),
    ...(dayPillarMatching.tags || []),
    ...(monthMatching.tags || []),
  ];
  
  // 오행 분포 유사도 태그 추가 (보완이 없고 유사도가 높을 때)
  if (isSimilarWuxing && complementarity.score === 0) {
    allTags.push(RELATION_TAGS.SIMILAR_WUXING);
  }
  
  const characteristics = {
    // 오행 보완 관련
    hasStrongComplementarity: complementarity.score >= 20,
    hasModerateComplementarity: complementarity.score >= 10 && complementarity.score < 20,
    hasWeakComplementarity: complementarity.score > 0 && complementarity.score < 10,
    hasNoComplementarity: complementarity.score === 0,
    
    // 일간/일지 매칭 관련
    hasStrongDayPillarMatch: dayPillarMatching.score >= 15,
    hasModerateDayPillarMatch: dayPillarMatching.score > 0 && dayPillarMatching.score < 15,
    hasDayPillarConflict: dayPillarMatching.score < 0,
    hasNoDayPillarMatch: dayPillarMatching.score === 0,
    
    // 태그 기반 특성
    hasTianganHe: allTags.includes(RELATION_TAGS.TIANGAN_HE),
    hasTianganChong: allTags.includes(RELATION_TAGS.TIANGAN_CHONG),
    hasJijiHe: allTags.includes(RELATION_TAGS.JIJI_HE),
    hasJijiChong: allTags.includes(RELATION_TAGS.JIJI_CHONG),
    hasSocialHe: allTags.includes(RELATION_TAGS.SOCIAL_HE),
    hasSocialChong: allTags.includes(RELATION_TAGS.SOCIAL_CHONG),
    hasSameStem: allTags.includes(RELATION_TAGS.SAME_STEM),
    hasComplementary: allTags.includes(RELATION_TAGS.COMPLEMENTARY),
    hasSimilarWuxing: allTags.includes(RELATION_TAGS.SIMILAR_WUXING),
    hasSameStrongWuxing: allTags.includes(RELATION_TAGS.SAME_STRONG_WUXING),
    
    // 복합 특성
    hasDayPillarMatch: dayPillarMatching.score > 0,
    hasNegativeDayPillar: allTags.includes(RELATION_TAGS.TIANGAN_CHONG) || allTags.includes(RELATION_TAGS.JIJI_CHONG) || allTags.includes(RELATION_TAGS.SOCIAL_CHONG),
  };
  
  return {
    score: finalScore,
    level,
    characteristics,
    maxScore: 100,
    minScore: 0,
    baseScore: baseScoreAdjusted,
    complementarityScore: complementarity.score,
    mentalScore,
    lifestyleScore,
    socialScore,
    dayPillarScore: dayPillarMatching.score,
    details: {
      complementarity: {
        score: complementarity.score,
        details: complementarity.details,
        tags: complementarity.tags
      },
      mental: {
        score: mentalScore,
        details: dayPillarMatching.details.filter(d => d.includes('천간') || d.includes('비견')),
        tags: dayPillarMatching.tags.filter(t => t === RELATION_TAGS.TIANGAN_HE || t === RELATION_TAGS.TIANGAN_CHONG || t === RELATION_TAGS.SAME_STEM)
      },
      lifestyle: {
        score: lifestyleScore,
        details: dayPillarMatching.details.filter(d => d.includes('합') || d.includes('충') || d.includes('원진') || d.includes('귀문') || d.includes('호흡')),
        tags: dayPillarMatching.tags.filter(t => t === RELATION_TAGS.JIJI_HE || t === RELATION_TAGS.JIJI_CHONG)
      },
      social: {
        score: socialScore,
        details: monthMatching.details,
        tags: monthMatching.tags
      }
    },
    wuxingPower: {
      userA: userAPower,
      userB: userBPower
    },
    tags: allTags
  };
}

