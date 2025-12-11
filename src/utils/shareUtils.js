// 친구 데이터를 URL 쿼리 파라미터로 인코딩
export function encodeFriendsToUrl(friends) {
  const data = friends.map(f => ({
    n: f.name,           // 이름
    b: f.birthdate,      // 생년월일 (200201 형식)
    g: f.gender || ''    // 성별 (선택사항)
  }));
  
  // Base64 인코딩 (URL-safe)
  const encoded = btoa(JSON.stringify(data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `${window.location.origin}${window.location.pathname}?share=${encoded}`;
}

// URL에서 친구 데이터 복원
export function decodeFriendsFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('share');
  
  if (!encoded) return null;
  
  try {
    // Base64 디코딩
    const decoded = atob(
      encoded.replace(/-/g, '+').replace(/_/g, '/')
    );
    const data = JSON.parse(decoded);
    
    // 친구 객체로 변환 (id 추가)
    return data.map((f, index) => ({
      id: `friend-${Date.now()}-${index}`,
      name: f.n,
      birthdate: f.b,
      gender: f.g || '',
    }));
  } catch (error) {
    console.error('URL 디코딩 실패:', error);
    return null;
  }
}

// URL 복사 함수
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback: 구형 브라우저 지원
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

