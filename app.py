"""
Team Synergy & Chemistry Analyzer
Streamlit 기반 사주 파트너십 분석 대시보드
"""

import streamlit as st
import plotly.graph_objects as go
import pandas as pd

try:
    from saju_compatibility import SajuCompatibility
except ImportError:
    st.error("⚠️ `saju_compatibility.py` 파일을 찾을 수 없습니다. 같은 디렉토리에 `saju_compatibility.py` 파일이 있어야 합니다.")
    st.stop()

# 페이지 설정
st.set_page_config(
    page_title="Team Synergy & Chemistry Analyzer",
    page_icon="🤝",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 커스텀 CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-container {
        background-color: #f0f2f6;
        padding: 1.5rem;
        border-radius: 10px;
        margin: 1rem 0;
    }
    .stMetric {
        background-color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
</style>
""", unsafe_allow_html=True)

# 타이틀
st.markdown('<h1 class="main-header">🤝 Team Synergy & Chemistry Analyzer</h1>', unsafe_allow_html=True)
st.markdown("---")

# SajuCompatibility 인스턴스 생성
@st.cache_resource
def get_compatibility_analyzer():
    return SajuCompatibility()

compatibility = get_compatibility_analyzer()

# 사이드바: 입력 폼
st.sidebar.header("📝 입력 정보")

st.sidebar.subheader("User A")
user_a_year = st.sidebar.number_input("연도 (Year)", min_value=1900, max_value=2100, value=1990, key="a_year")
user_a_month = st.sidebar.number_input("월 (Month)", min_value=1, max_value=12, value=1, key="a_month")
user_a_day = st.sidebar.number_input("일 (Day)", min_value=1, max_value=31, value=1, key="a_day")
user_a_hour = st.sidebar.number_input("시 (Hour)", min_value=0, max_value=23, value=0, key="a_hour")

st.sidebar.markdown("---")

st.sidebar.subheader("User B (Partner/Colleague)")
user_b_year = st.sidebar.number_input("연도 (Year)", min_value=1900, max_value=2100, value=1990, key="b_year")
user_b_month = st.sidebar.number_input("월 (Month)", min_value=1, max_value=12, value=1, key="b_month")
user_b_day = st.sidebar.number_input("일 (Day)", min_value=1, max_value=31, value=1, key="b_day")
user_b_hour = st.sidebar.number_input("시 (Hour)", min_value=0, max_value=23, value=0, key="b_hour")

# 사주 계산 유틸리티 함수
TIANGAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
JIJI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']

def calculate_year_pillar(year):
    """년주 계산"""
    BASE_YEAR = 1900
    BASE_STEM_INDEX = 6  # 경
    BASE_JIJI_INDEX = 0  # 자
    
    year_diff = year - BASE_YEAR
    stem_index = (year_diff + BASE_STEM_INDEX) % 10
    jiji_index = (year_diff + BASE_JIJI_INDEX) % 12
    
    return TIANGAN[stem_index if stem_index >= 0 else stem_index + 10], JIJI[jiji_index if jiji_index >= 0 else jiji_index + 12]

def calculate_month_pillar(year, month):
    """월주 계산"""
    BASE_YEAR = 1900
    BASE_MONTH = 1
    BASE_STEM_INDEX = 3  # 정
    BASE_JIJI_INDEX = 1  # 축
    
    year_diff = year - BASE_YEAR
    month_diff = month - BASE_MONTH
    total_months = year_diff * 12 + month_diff
    
    stem_index = (total_months + BASE_STEM_INDEX) % 10
    jiji_index = (total_months + BASE_JIJI_INDEX) % 12
    
    return TIANGAN[stem_index if stem_index >= 0 else stem_index + 10], JIJI[jiji_index if jiji_index >= 0 else jiji_index + 12]

def calculate_day_pillar(year, month, day):
    """일주 계산"""
    from datetime import datetime
    
    BASE_DATE = datetime(1900, 1, 1)
    TARGET_DATE = datetime(year, month, day)
    
    total_days = (TARGET_DATE - BASE_DATE).days + 1
    BASE_STEM_INDEX = 0  # 갑
    BASE_JIJI_INDEX = 11  # 술
    
    stem_index = (total_days + BASE_STEM_INDEX) % 10
    jiji_index = (total_days + BASE_JIJI_INDEX - 1) % 12  # -1 버그 수정 반영
    
    return TIANGAN[stem_index if stem_index >= 0 else stem_index + 10], JIJI[jiji_index if jiji_index >= 0 else (jiji_index + 12) % 12]

def calculate_hour_pillar(day_stem, hour):
    """시주 계산 (일간을 기반으로)"""
    # 시지 계산 (간단한 방법)
    hour_to_jiji = {
        23: 0, 0: 0, 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 5,
        11: 6, 12: 6, 13: 7, 14: 7, 15: 8, 16: 8, 17: 9, 18: 9, 19: 10, 20: 10, 21: 11, 22: 11
    }
    
    jiji_index = hour_to_jiji.get(hour, 0)
    jiji = JIJI[jiji_index]
    
    # 시간 계산 (일간을 기반으로)
    day_stem_char = day_stem[0]
    day_stem_index = TIANGAN.index(day_stem_char) if day_stem_char in TIANGAN else 0
    
    # 일간의 천간 인덱스를 기반으로 시간 계산 (간단한 방법)
    hour_stem_index = (day_stem_index * 2 + (hour // 2)) % 10
    hour_stem = TIANGAN[hour_stem_index]
    
    return hour_stem, jiji

def get_stem_branch_from_datetime(year, month, day, hour):
    """사주 8글자 계산"""
    year_stem, year_branch = calculate_year_pillar(year)
    month_stem, month_branch = calculate_month_pillar(year, month)
    day_stem, day_branch = calculate_day_pillar(year, month, day)
    hour_stem, hour_branch = calculate_hour_pillar(day_stem, hour)
    
    return {
        'year_stem': year_stem,
        'year_branch': year_branch,
        'month_stem': month_stem,
        'month_branch': month_branch,
        'day_stem': day_stem,
        'day_branch': day_branch,
        'hour_stem': hour_stem,
        'hour_branch': hour_branch
    }

# 분석 버튼
if st.sidebar.button("🔍 분석 시작", type="primary", use_container_width=True):
    # 사주 데이터 준비
    user_a_saju = get_stem_branch_from_datetime(user_a_year, user_a_month, user_a_day, user_a_hour)
    user_b_saju = get_stem_branch_from_datetime(user_b_year, user_b_month, user_b_day, user_b_hour)
    
    # 분석 실행
    result = compatibility.calculate_compatibility(user_a_saju, user_b_saju)
    
    # 결과를 session_state에 저장
    st.session_state['analysis_result'] = result
    st.session_state['user_a_saju'] = user_a_saju
    st.session_state['user_b_saju'] = user_b_saju

# 결과 표시
if 'analysis_result' in st.session_state:
    result = st.session_state['analysis_result']
    
    # 종합 점수 표시
    st.markdown("## 📊 종합 점수")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            label="종합 점수",
            value=f"{result['score']}점",
            delta=f"{result['score'] - 50}점",
            delta_color="normal"
        )
    
    with col2:
        st.metric(
            label="기본 점수",
            value=f"{result['base_score']}점"
        )
    
    with col3:
        st.metric(
            label="오행 상호보완",
            value=f"{result['complementarity_score']}점",
            delta=f"Max 40점"
        )
    
    with col4:
        st.metric(
            label="일주 매칭",
            value=f"{result['day_pillar_score']}점",
            delta=f"Max 20점"
        )
    
    # 게이지 차트
    st.markdown("---")
    st.markdown("## 📈 점수 게이지")
    
    fig_gauge = go.Figure(go.Indicator(
        mode = "gauge+number+delta",
        value = result['score'],
        domain = {'x': [0, 1], 'y': [0, 1]},
        title = {'text': "종합 파트너십 점수"},
        delta = {'reference': 50},
        gauge = {
            'axis': {'range': [None, 100]},
            'bar': {'color': "darkblue"},
            'steps': [
                {'range': [0, 40], 'color': "lightgray"},
                {'range': [40, 70], 'color': "gray"},
                {'range': [70, 100], 'color': "lightgreen"}
            ],
            'threshold': {
                'line': {'color': "red", 'width': 4},
                'thickness': 0.75,
                'value': 90
            }
        }
    ))
    
    fig_gauge.update_layout(height=300)
    st.plotly_chart(fig_gauge, use_container_width=True)
    
    # 오행 분석 (Radar Chart)
    st.markdown("---")
    st.markdown("## 🌟 오행 분석 (Radar Chart)")
    
    wuxing_labels = ['목', '화', '토', '금', '수']
    user_a_power = [result['wuxing_power']['user_a'][w] for w in wuxing_labels]
    user_b_power = [result['wuxing_power']['user_b'][w] for w in wuxing_labels]
    
    # 최대값 계산 (차트 스케일링용)
    max_power = max(max(user_a_power), max(user_b_power), 10)
    
    fig_radar = go.Figure()
    
    # User A
    fig_radar.add_trace(go.Scatterpolar(
        r=user_a_power + [user_a_power[0]],  # 닫기 위해 첫 번째 값 추가
        theta=wuxing_labels + [wuxing_labels[0]],
        fill='toself',
        name='User A',
        line_color='#1f77b4'
    ))
    
    # User B
    fig_radar.add_trace(go.Scatterpolar(
        r=user_b_power + [user_b_power[0]],
        theta=wuxing_labels + [wuxing_labels[0]],
        fill='toself',
        name='User B (Partner/Colleague)',
        line_color='#ff7f0e'
    ))
    
    fig_radar.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                range=[0, max_power]
            )),
        showlegend=True,
        title="오행 세력 비교 (상호보완성 시각화)",
        height=500
    )
    
    st.plotly_chart(fig_radar, use_container_width=True)
    
    # 상세 분석
    st.markdown("---")
    st.markdown("## 📋 상세 분석")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### 오행 상호보완 분석")
        if result['details']['complementarity']['details']:
            for detail in result['details']['complementarity']['details']:
                st.info(f"✅ {detail}")
        else:
            st.warning("오행 상호보완 요소가 없습니다.")
    
    with col2:
        st.markdown("### 일주 매칭 분석")
        if result['details']['day_pillar']['details']:
            for detail in result['details']['day_pillar']['details']:
                if '업무 합' in detail or '팀워크' in detail or '+' in detail:
                    st.success(f"✅ {detail}")
                elif '주의' in detail or '조율' in detail or '-' in detail:
                    st.error(f"⚠️ {detail}")
                else:
                    st.info(f"ℹ️ {detail}")
        else:
            st.warning("일주 매칭 요소가 없습니다.")
    
    # 오행 세력 상세 표
    st.markdown("---")
    st.markdown("## 📊 오행 세력 상세")
    
    df = pd.DataFrame({
        '오행': wuxing_labels,
        'User A': user_a_power,
        'User B': user_b_power,
        '차이': [abs(a - b) for a, b in zip(user_a_power, user_b_power)]
    })
    
    st.dataframe(df, use_container_width=True, hide_index=True)
    
else:
    # 초기 화면
    st.info("👈 왼쪽 사이드바에서 User A와 User B의 생년월일을 입력하고 '분석 시작' 버튼을 클릭하세요.")
    
    st.markdown("""
    ### 📌 사용 방법
    1. **User A 정보 입력**: 왼쪽 사이드바에서 첫 번째 사용자의 생년월일과 시간을 입력하세요.
    2. **User B 정보 입력**: 두 번째 사용자(파트너/동료)의 생년월일과 시간을 입력하세요.
    3. **분석 시작**: '분석 시작' 버튼을 클릭하여 파트너십 분석을 실행하세요.
    
    ### 🎯 분석 항목
    - **종합 점수**: 전체 파트너십 점수 (0-100점)
    - **오행 상호보완**: 서로 부족한 부분을 채워주는 정도 (Max 40점)
    - **일주 매칭**: 가치관/소통(천간)과 성격/스타일(지지) 매칭 (Max 20점)
    - **오행 분석**: 시각적 Radar Chart로 상호보완성 확인
    """)

