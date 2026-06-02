import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  UserCircle, 
  Settings, 
  Play, 
  ArrowRight, 
  Key, 
  Trash2, 
  Clock, 
  BookOpen,
  HelpCircle
} from 'lucide-react';

export default function LandingPage({ 
  createRoom, 
  joinRoom, 
  availableRooms, 
  enterRoom, 
  deleteRoom,
  verifyRoomPin 
}) {
  const [studentCode, setStudentCode] = useState('');
  const [studentTeam, setStudentTeam] = useState('');
  
  // Teacher modal control
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherTab, setTeacherTab] = useState('create'); // 'create', 'resume', 'guide'
  
  const [teacherPin, setTeacherPin] = useState('');
  const [teacherDifficulty, setTeacherDifficulty] = useState('standard');
  const [resumeCode, setResumeCode] = useState('');
  const [resumePin, setResumePin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [teacherErrorMsg, setTeacherErrorMsg] = useState('');

  const handleStudentJoin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!studentCode.trim() || !studentTeam.trim()) {
      setErrorMsg('수업 코드와 모둠명을 모두 입력해 주세요.');
      return;
    }
    if (studentCode.length !== 6 || isNaN(studentCode)) {
      setErrorMsg('수업 코드는 6자리 숫자여야 합니다.');
      return;
    }
    
    const result = joinRoom(studentCode.trim(), studentTeam.trim());
    if (!result.success) {
      setErrorMsg(result.message);
    } else {
      window.location.reload();
    }
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    setTeacherErrorMsg('');
    if (teacherPin !== '1234') {
      setTeacherErrorMsg('올바른 교사용 PIN을 입력해 주세요. (기본 PIN: 1234)');
      return;
    }

    const code = createRoom(teacherDifficulty, teacherPin);
    localStorage.setItem('exchange_game_current_role', 'teacher');
    localStorage.setItem('exchange_game_current_code', code);
    window.location.reload();
  };

  const handleResumeRoom = (e) => {
    e.preventDefault();
    setTeacherErrorMsg('');
    if (!resumeCode) {
      setTeacherErrorMsg('이어갈 수업 코드를 선택해 주세요.');
      return;
    }
    const isValid = verifyRoomPin(resumeCode, resumePin);
    if (!isValid) {
      setTeacherErrorMsg('교사용 PIN이 올바르지 않습니다.');
      return;
    }
    enterRoom(resumeCode);
    localStorage.setItem('exchange_game_current_role', 'teacher');
    localStorage.setItem('exchange_game_current_code', resumeCode);
    window.location.reload();
  };

  const handleClearAllData = () => {
    if (window.confirm('정말 모든 게임 데이터(저장된 모든 방과 모둠)를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center' }}>
      {/* Top Navbar */}
      <header className="header-bar" style={{ borderBottom: 'none', marginBottom: '0' }}>
        <div className="logo-section">
          <h1 style={{ color: 'var(--color-primary)', fontSize: '1.4rem' }}>
            <TrendingUp size={24} style={{ color: 'var(--color-primary)' }} />
            꿈·돈·길
          </h1>
        </div>
      </header>

      {/* Main Two-Column Hero Split (Matches the reference image layout) */}
      <main className="landing-grid">
        {/* Left Side: Branding, description & teacher entry */}
        <section className="landing-left">
          <span className="landing-badge">금융 교육 시뮬레이터</span>
          <h2>
            환율 파도타기:
            <span>글로벌 자산가</span>
          </h2>
          <p>
            내가 꿈꾸는 미래의 삶에는 얼마가 필요할까요?<br />
            국제 경제 뉴스를 분석하고 원화·달러화·엔화 자산 비중을 조절하여,<br />
            변동하는 환율의 원리를 체험하고 최고의 자산가에 도전해 보세요!
          </p>

          <div>
            <button 
              className="btn-secondary" 
              onClick={() => {
                setTeacherErrorMsg('');
                setShowTeacherModal(true);
              }}
              style={{
                padding: '0.9rem 1.8rem',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              🔑 교사용 대시보드로 입장하기
            </button>
          </div>
        </section>

        {/* Right Side: Fixed student login form card (Matches the reference card layout) */}
        <section className="landing-right">
          <div className="glass-card" style={{ padding: '2.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '2rem', color: '#0f172a' }}>
              학생 접속하기
            </h3>

            {errorMsg && (
              <div className="badge badge-danger" style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: '0.5rem', 
                marginBottom: '1.5rem',
                display: 'block',
                textAlign: 'center',
                textTransform: 'none',
                fontSize: '0.85rem'
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleStudentJoin}>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>6자리 세션 번호</label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="교사 대시보드의 6자리 번호 입력"
                  className="input-field" 
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value.replace(/\D/g, ''))}
                  required
                  style={{ height: '3.25rem' }}
                />
              </div>

              <div className="input-group" style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569' }}>본인 이름 (또는 닉네임)</label>
                <input 
                  type="text" 
                  placeholder="출석부의 이름 입력"
                  className="input-field" 
                  value={studentTeam}
                  onChange={(e) => setStudentTeam(e.target.value)}
                  required
                  style={{ height: '3.25rem' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', height: '3.5rem', fontSize: '1.05rem', borderRadius: '0.75rem' }}
              >
                🚀 시뮬레이션 입장하기
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer Text */}
      <footer className="footer-text">
        © 2026 꿈돈길. All rights reserved.
      </footer>

      {/* Teacher Overlay Modal */}
      {showTeacherModal && (
        <div className="modal-overlay" onClick={() => setShowTeacherModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', padding: '2.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
              <UserCircle style={{ color: 'var(--color-primary)' }} /> 교사용 수업 관리 시스템
            </h3>

            {/* Modal Internal Tabs */}
            <div className="segment-control" style={{ marginBottom: '1.5rem' }}>
              <button 
                type="button" 
                className={`segment-btn ${teacherTab === 'create' ? 'active' : ''}`}
                onClick={() => { setTeacherTab('create'); setTeacherErrorMsg(''); }}
              >
                새 수업 개설
              </button>
              <button 
                type="button" 
                className={`segment-btn ${teacherTab === 'resume' ? 'active' : ''}`}
                onClick={() => { setTeacherTab('resume'); setTeacherErrorMsg(''); }}
              >
                수업 이어하기
              </button>
              <button 
                type="button" 
                className={`segment-btn ${teacherTab === 'guide' ? 'active' : ''}`}
                onClick={() => { setTeacherTab('guide'); setTeacherErrorMsg(''); }}
              >
                설정 및 가이드
              </button>
            </div>

            {teacherErrorMsg && (
              <div className="badge badge-danger" style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: '0.5rem', 
                marginBottom: '1.25rem',
                display: 'block',
                textAlign: 'center',
                textTransform: 'none',
                fontSize: '0.85rem'
              }}>
                {teacherErrorMsg}
              </div>
            )}

            {/* TAB 1: Create Room */}
            {teacherTab === 'create' && (
              <form onSubmit={handleCreateRoom}>
                <div className="input-group">
                  <label>교사용 인증 PIN (기본: 1234)</label>
                  <input 
                    type="password" 
                    placeholder="PIN 번호 입력"
                    className="input-field" 
                    value={teacherPin}
                    onChange={(e) => setTeacherPin(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group" style={{ marginBottom: '2rem' }}>
                  <label>난이도 설정</label>
                  <div className="segment-control" style={{ padding: '0.2rem' }}>
                    <button 
                      type="button" 
                      className={`segment-btn ${teacherDifficulty === 'basic' ? 'active' : ''}`}
                      onClick={() => setTeacherDifficulty('basic')}
                      style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                    >
                      기본 모드
                    </button>
                    <button 
                      type="button" 
                      className={`segment-btn ${teacherDifficulty === 'standard' ? 'active' : ''}`}
                      onClick={() => setTeacherDifficulty('standard')}
                      style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                    >
                      표준 모드
                    </button>
                    <button 
                      type="button" 
                      className={`segment-btn ${teacherDifficulty === 'evaluation' ? 'active' : ''}`}
                      onClick={() => setTeacherDifficulty('evaluation')}
                      style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                    >
                      평가형 모드
                    </button>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                    {teacherDifficulty === 'basic' && "💡 뉴스 요약, 힌트 가이드, 핵심 개념 태그가 모두 학생 태블릿에 제공됩니다."}
                    {teacherDifficulty === 'standard' && "💡 뉴스와 개념 태그가 제공되나, 교과서 힌트박스가 숨겨집니다."}
                    {teacherDifficulty === 'evaluation' && "💡 뉴스 헤드라인만 주어지며, 학생들이 인과 관계를 완전히 유추해야 합니다."}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowTeacherModal(false)}>
                    닫기
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1.5 }}>
                    수업 개설하기
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Resume Room */}
            {teacherTab === 'resume' && (
              <div>
                {availableRooms.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: '2rem 0', fontSize: '0.95rem' }}>
                    최근 개설된 수업 내역이 없습니다.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {availableRooms.map((room) => (
                      <div 
                        key={room.code} 
                        onClick={() => setResumeCode(room.code)}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '0.75rem',
                          border: `1.5px solid ${resumeCode === room.code ? 'var(--color-primary)' : 'rgba(0, 102, 255, 0.08)'}`,
                          background: resumeCode === room.code ? 'rgba(0, 102, 255, 0.04)' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 800, fontSize: '1.05rem', marginRight: '0.5rem' }}>코드: {room.code}</span>
                          <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>{room.difficulty.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span>라운드: {room.currentRound}/5</span>
                          <button 
                            type="button" 
                            className="btn-danger" 
                            style={{ padding: '0.25rem 0.4rem', borderRadius: '0.35rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`수업 코드 ${room.code}를 삭제하시겠습니까?`)) {
                                deleteRoom(room.code);
                                if (resumeCode === room.code) setResumeCode('');
                              }
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {resumeCode && (
                  <form onSubmit={handleResumeRoom}>
                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                      <label>교사용 PIN 입력</label>
                      <input 
                        type="password" 
                        placeholder="PIN 번호 입력"
                        className="input-field" 
                        value={resumePin}
                        onChange={(e) => setResumePin(e.target.value)}
                        required
                      />
                    </div>
                  </form>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowTeacherModal(false)}>
                    닫기
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ flex: 1.5 }} 
                    disabled={!resumeCode || !resumePin}
                    onClick={handleResumeRoom}
                  >
                    수업 이어하기
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Guide & Reset */}
            {teacherTab === 'guide' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '0.25rem' }}>
                  <div>
                    <h4 style={{ color: '#0f172a', fontWeight: 800, marginBottom: '0.15rem' }}>1. 게임 기본 진행</h4>
                    <p>교사가 대시보드를 열어 6자리 코드를 보여주고, 학생들이 모둠별로 입장한 후 5개 라운드의 투자를 진행합니다.</p>
                  </div>
                  <div>
                    <h4 style={{ color: '#0f172a', fontWeight: 800, marginBottom: '0.15rem' }}>2. 통화 가치 변동 공식</h4>
                    <p>금리 상승 및 호재 뉴스는 해당 통화 가치 변동률을 상승시키며, 유가 급등이나 리스크 확대 시 신흥국 자산인 원화 가치가 하락합니다.</p>
                  </div>
                  <div>
                    <h4 style={{ color: '#0f172a', fontWeight: 800, marginBottom: '0.15rem' }}>3. 평가 가산점</h4>
                    <p>단순 자산 순위 외에 제출된 서술형 예측 이유 내 경제 핵심 단어(금리, 달러, 캐리트레이드 등) 자동 검출을 반영하여 '뉴스 해석 점수'가 가산됩니다.</p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(0, 102, 255, 0.08)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', display: 'block', color: '#0f172a' }}>로컬 데이터 전체 초기화</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>브라우저의 모든 진행 수업 및 방 정보를 영구 삭제합니다.</span>
                  </div>
                  <button type="button" className="btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={handleClearAllData}>
                    <Trash2 size={14} /> 전체 초기화
                  </button>
                </div>

                <button type="button" className="btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setShowTeacherModal(false)}>
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
