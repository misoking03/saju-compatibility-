// 친구 데이터를 URL 쿼리 파라미터로 인코딩
export function encodeFriendsToUrl(friends) {
  try {
    if (!friends || friends.length === 0) {
      console.error('친구 데이터가 없습니다.');
      return null;
    }

    const data = friends.map(f => ({
      n: f.name,           // 이름
      y: f.year,           // 연도 (숫자)
      m: f.month,          // 월 (숫자)
      d: f.day,            // 일 (숫자)
      h: f.hour !== null && f.hour !== undefined ? f.hour : null,   // 시
      min: f.minute !== null && f.minute !== undefined ? f.minute : null, // 분
      l: f.isLunar || false, // 음력 여부
      g: f.gender || ''    // 성별
    }));
    
    // JSON 문자열로 변환
    const jsonString = JSON.stringify(data);
    
    // UTF-8 인코딩 후 Base64 인코딩 (한글 지원)
    const encoded = btoa(unescape(encodeURIComponent(jsonString)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return `${window.location.origin}${window.location.pathname}?share=${encoded}`;
  } catch (error) {
    console.error('URL 인코딩 실패:', error);
    return null;
  }
}

// URL에서 친구 데이터 복원
export function decodeFriendsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('share');
  
  if (!encoded) return null;
  
  try {
    // Base64 디코딩 후 UTF-8 디코딩
    const decoded = decodeURIComponent(escape(atob(
      encoded.replace(/-/g, '+').replace(/_/g, '/')
    )));
    const data = JSON.parse(decoded);
    
    // 친구 객체로 변환 (모든 필수 필드 포함)
    return data.map((f, index) => ({
      id: `friend-${Date.now()}-${index}`,
      name: f.n,
      year: parseInt(f.y),
      month: parseInt(f.m),
      day: parseInt(f.d),
      hour: f.h !== null && f.h !== undefined ? parseInt(f.h) : null,
      minute: f.min !== null && f.min !== undefined ? parseInt(f.min) : null,
      isLunar: f.l === true,
      gender: f.g || '',
    }));
  } catch (error) {
    console.error('URL 디코딩 실패:', error);
    return null;
  }
}

// URL 복사 함수
export async function copyToClipboard(text) {
  if (!text) {
    console.error('복사할 텍스트가 없습니다.');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.warn('Clipboard API 실패, fallback 사용:', error);
    // Fallback: 구형 브라우저 지원
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      console.error('Fallback 복사 실패:', err);
      return false;
    }
  }
}

