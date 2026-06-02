import React, { useState } from 'react';
import { 
  Play, 
  ArrowRight, 
  Lock, 
  Unlock, 
  Users, 
  TrendingUp, 
  Award, 
  FileText, 
  Download, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Check, 
  Trash2, 
  AlertCircle,
  HelpCircle,
  BarChart2
} from 'lucide-react';
import { exchangeRounds } from '../data/exchangeRounds';

export default function TeacherDashboard({ 
  roomCode, 
  roomData, 
  teamsData, 
  startGame, 
  closeRound, 
  nextRound, 
  deleteRoom,
  leaveRoom 
}) {
  const [showPin, setShowPin] = useState(false);
  const [peekSubmissions, setPeekSubmissions] = useState(true); // Let teacher show/hide answers on screen
  const [activeTab, setActiveTab] = useState('status'); // 'status', 'history', 'leaderboard'

  const currentRoundNum = roomData?.currentRound || 0;
  const roundStatus = roomData?.roundStatus || 'waiting';
  const difficulty = roomData?.difficulty || 'standard';
  const teams = roomData?.teams || [];

  const handleStartGame = () => {
    if (teams.length === 0) {
      alert('최소 1개 이상의 모둠이 참가해야 게임을 시작할 수 있습니다.');
      return;
    }
    if (window.confirm('모둠 참가를 마감하고 시뮬레이션을 시작하시겠습니까? 더 이상 새 모둠이 들어올 수 없습니다.')) {
      startGame(roomCode);
    }
  };

  const handleCloseRound = () => {
    // Count how many submitted
    const totalTeams = teams.length;
    const submittedTeams = teams.filter(tName => teamsData[tName]?.isSubmittedCurrentRound).length;

    if (submittedTeams < totalTeams) {
      if (!window.confirm(`아직 제출하지 않은 모둠이 있습니다 (${submittedTeams}/${totalTeams} 제출). 현재 상태로 마감하고 환율 변동을 적용하시겠습니까? (미제출 모둠은 원화 100% 보유로 처리)`)) {
        return;
      }
    } else {
      if (!window.confirm('라운드를 마감하고 환율 변동을 집계하시겠습니까?')) {
        return;
      }
    }
    closeRound(roomCode);
  };

  const handleNextRound = () => {
    const isLastRound = currentRoundNum === 5;
    const msg = isLastRound 
      ? '5라운드 결과가 반영되었습니다. 게임을 완전히 종료하고 성찰 및 최종 순위표를 집계하시겠습니까?' 
      : '다음 라운드를 시작하시겠습니까? 학생들이 새로운 뉴스를 읽고 포트폴리오를 조정할 수 있게 됩니다.';

    if (window.confirm(msg)) {
      nextRound(roomCode);
      if (isLastRound) {
        setActiveTab('leaderboard');
      }
    }
  };

  const handleExitDashboard = () => {
    if (window.confirm('대시보드에서 나가시겠습니까? 게임 데이터는 브라우저에 임시 유지됩니다.')) {
      leaveRoom();
      localStorage.removeItem('exchange_game_current_role');
      localStorage.removeItem('exchange_game_current_code');
      window.location.reload();
    }
  };

  const handleResetGame = () => {
    if (window.confirm('정말 이 수업을 삭제하시겠습니까? 모든 모둠 정보와 투자 내역이 소멸합니다.')) {
      deleteRoom(roomCode);
      localStorage.removeItem('exchange_game_current_role');
      localStorage.removeItem('exchange_game_current_code');
      window.location.reload();
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (!teams || teams.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'; // UTF-8 BOM
    csvContent += '모둠명,최종자산(원),총수익률(%),누적뉴스점수(350점만점),최종성찰\r\n';

    teams.forEach(tName => {
      const team = teamsData[tName];
      if (!team) return;
      
      const finalAsset = team.currentAsset;
      const totalReturn = (((finalAsset - 100000000) / 100000000) * 100).toFixed(2);
      const totalNewsScore = team.submissions.reduce((sum, s) => sum + (s.newsScore || 0), 0);
      const cleanReflection = (team.reflection || '').replace(/"/g, '""');

      csvContent += `"${tName}",${finalAsset},${totalReturn},${totalNewsScore},"${cleanReflection}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `수업코드_${roomCode}_환율게임_결과보고서.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export utility
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(teamsData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `수업코드_${roomCode}_환율게임_RawData.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatKRW = (val) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })
      .format(val)
      .replace('₩', '') + ' 원';
  };

  // Sort teams for leaderboard
  const getRankedTeams = () => {
    return [...teams].map(tName => {
      const team = teamsData[tName];
      const finalAsset = team?.currentAsset || 100000000;
      const totalReturn = ((finalAsset - 100000000) / 100000000) * 100;
      const totalNewsScore = team?.submissions.reduce((sum, s) => sum + (s.newsScore || 0), 0) || 0;
      const dominantStrategy = analyzeDominantStrategy(team?.submissions || []);
      
      return {
        name: tName,
        finalAsset,
        totalReturn,
        totalNewsScore,
        dominantStrategy,
        reflection: team?.reflection || '미제출'
      };
    }).sort((a, b) => b.finalAsset - a.finalAsset);
  };

  const analyzeDominantStrategy = (submissions) => {
    if (submissions.length === 0) return '없음';
    const counts = {};
    submissions.forEach(s => {
      const t = s.strategyType || '기타';
      counts[t] = (counts[t] || 0) + 1;
    });
    let maxType = '기타';
    let maxCount = 0;
    Object.keys(counts).forEach(k => {
      if (counts[k] > maxCount) {
        maxCount = counts[k];
        maxType = k;
      }
    });
    return maxType;
  };

  const currentRoundScenario = exchangeRounds.find(r => r.id === currentRoundNum);
  const submittedCount = teams.filter(tName => teamsData[tName]?.isSubmittedCurrentRound).length;

  return (
    <div className="app-container teacher-whiteboard-mode">
      {/* Header bar */}
      <div className="header-bar">
        <div className="logo-section">
          <h1>교사용 대시보드 - 수업 코드 [{roomCode}]</h1>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
            <span className="badge badge-primary">난이도: {difficulty.toUpperCase()}</span>
            <span className="badge badge-warning" onClick={() => setShowPin(!showPin)} style={{ cursor: 'pointer' }}>
              🔑 {showPin ? `PIN: ${roomData?.pin || '1234'}` : 'PIN 보기'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={handleExitDashboard}>
            로비로
          </button>
          <button className="btn-danger" onClick={handleResetGame}>
            <Trash2 size={16} /> 수업 삭제
          </button>
        </div>
      </div>

      <div className="teacher-grid">
        {/* Sidebar Controls */}
        <aside className="dashboard-sidebar">
          {/* Game Progression Control Box */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              시뮬레이션 통제실
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>현재 상태</span>
                {roundStatus === 'waiting' && <h2 style={{ color: 'var(--color-warning)' }}>모둠 모집 중</h2>}
                {roundStatus === 'open' && <h2 style={{ color: 'var(--color-success)' }}>{currentRoundNum}라운드 진행 중</h2>}
                {roundStatus === 'closed' && <h2 style={{ color: 'var(--color-primary)' }}>{currentRoundNum}라운드 마감됨</h2>}
                {roundStatus === 'finished' && <h2 style={{ color: 'var(--color-krw)' }}>시뮬레이션 종료</h2>}
              </div>

              {/* Dynamic Action Button */}
              {roundStatus === 'waiting' && (
                <button className="btn-primary" style={{ width: '100%' }} onClick={handleStartGame}>
                  모둠 확정 및 1R 개시 <Play size={16} />
                </button>
              )}

              {roundStatus === 'open' && (
                <button className="btn-danger" style={{ width: '100%' }} onClick={handleCloseRound}>
                  라운드 마감 및 환율 반영 <Lock size={16} />
                </button>
              )}

              {roundStatus === 'closed' && (
                <button className="btn-primary" style={{ width: '100%' }} onClick={handleNextRound}>
                  {currentRoundNum === 5 ? '최종 결과 집계' : `${currentRoundNum + 1}라운드 시작`} <ArrowRight size={16} />
                </button>
              )}

              {roundStatus === 'finished' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button className="btn-primary" style={{ width: '100%' }} onClick={handleExportCSV}>
                    <Download size={16} /> CSV 다운로드
                  </button>
                  <button className="btn-secondary" style={{ width: '100%' }} onClick={handleExportJSON}>
                    Raw JSON 다운로드
                  </button>
                </div>
              )}

              {/* Info text */}
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                {roundStatus === 'waiting' && "📌 학생 기기에서 수업 코드와 모둠명을 쓰고 입장하게 지도해 주세요. 입장 완료 후 확정 버튼을 누르면 시작합니다."}
                {roundStatus === 'open' && `📌 학생들이 뉴스를 보고 비중과 근거를 제출하고 있습니다. (${submittedCount}/${teams.length} 제출)`}
                {roundStatus === 'closed' && "📌 환율 변동이 자산에 반영되었습니다. 학생 기기에서 손익 결과 피드백을 보고 배울 수 있게 시간을 준 후 다음 라운드로 진행하세요."}
                {roundStatus === 'finished' && "📌 모든 라운드가 끝났습니다. 학생들이 최종 보고서(성찰)를 작성해 내면 아래 성찰 탭에 실시간 반영됩니다."}
              </div>
            </div>
          </div>

          {/* Joined Teams sidebar tab */}
          <div className="glass-card team-list-card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>참가 모둠 ({teams.length})</span>
              <Users size={18} style={{ color: 'var(--text-secondary)' }} />
            </h3>
            
            {teams.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '1rem 0' }}>입장 대기 중...</p>
            ) : (
              <div>
                {teams.map((tName) => {
                  const team = teamsData[tName];
                  const hasSub = team?.isSubmittedCurrentRound;
                  return (
                    <div 
                      key={tName} 
                      className={`team-row ${hasSub && roundStatus === 'open' ? 'submitted' : ''}`}
                    >
                      <span style={{ fontWeight: 700 }}>{tName}</span>
                      {roundStatus === 'open' && (
                        <span className="badge" style={{
                          backgroundColor: hasSub ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: hasSub ? '#34d399' : 'var(--text-muted)'
                        }}>
                          {hasSub ? '제출 완료' : '작성 중'}
                        </span>
                      )}
                      {roundStatus === 'closed' && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-success)' }}>
                          {team ? formatKRW(team.currentAsset) : ''}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Main Dashboard Panel */}
        <main className="dashboard-main">
          {/* Navigation tabs */}
          <div className="segment-control" style={{ width: 'fit-content' }}>
            <button 
              className={`segment-btn ${activeTab === 'status' ? 'active' : ''}`}
              onClick={() => setActiveTab('status')}
            >
              실시간 현황판
            </button>
            <button 
              className={`segment-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
              disabled={currentRoundNum === 0}
            >
              라운드 뉴스 로그
            </button>
            <button 
              className={`segment-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
              disabled={currentRoundNum === 0}
            >
              최종 리더보드
            </button>
          </div>

          {/* 1. LOBBY VIEW (before start) */}
          {roundStatus === 'waiting' && activeTab === 'status' && (
            <div className="glass-card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyItems: 'center', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '350px' }}>
              <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>학생 참여 대기 중</span>
              <h2 style={{ fontSize: '6rem', fontWeight: 900, letterSpacing: '0.1em', color: 'var(--color-primary)', margin: '1rem 0' }}>
                {roomCode}
              </h2>
              <p style={{ maxWidth: '500px', color: 'var(--text-secondary)' }}>
                칠판의 6자리 수업 코드를 보고 학생용 입장 페이지에서 모둠명을 등록하여 참여해 주세요. 
                모둠이 모두 들어오면 왼쪽 통제실에서 [1라운드 개시] 버튼을 눌러 개시합니다.
              </p>
            </div>
          )}

          {/* 2. ROUND ACTIVE VIEW */}
          {roundStatus !== 'waiting' && activeTab === 'status' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Current scenario card */}
              {currentRoundScenario && (
                <div className="glass-card" style={{ borderLeft: '5px solid var(--color-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span className="badge badge-primary">{currentRoundNum}라운드 핵심 지표 뉴스</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>난이도: {difficulty}</span>
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>{currentRoundScenario.headline}</h3>
                  {difficulty !== 'evaluation' && <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{currentRoundScenario.brief}</p>}
                </div>
              )}

              {/* Submissions check grid */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3>모둠별 제출 상세 현황 ({submittedCount} / {teams.length} 완료)</h3>
                  <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setPeekSubmissions(!peekSubmissions)}>
                    {peekSubmissions ? <EyeOff size={14} /> : <Eye size={14} />} {peekSubmissions ? '전략 가리기' : '실시간 전략 훔쳐보기'}
                  </button>
                </div>

                {teams.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' }}>참가한 모둠이 없습니다.</p>
                ) : (
                  <div className="submissions-grid">
                    {teams.map((tName) => {
                      const team = teamsData[tName];
                      const sub = team?.submissions.find(s => s.round === currentRoundNum);
                      const isSub = team?.isSubmittedCurrentRound;
                      
                      return (
                        <div key={tName} className={`submission-team-card ${isSub ? 'ready' : ''}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{tName}</span>
                            <span className={`badge ${isSub ? 'badge-success' : 'badge-warning'}`} style={{ textTransform: 'none' }}>
                              {isSub ? '제출 완료' : '작성 중'}
                            </span>
                          </div>

                          {/* Show weights and reasons if peek option is active */}
                          {isSub && sub && peekSubmissions ? (
                            <div style={{ marginTop: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--color-krw)' }}>원화: {sub.weights.krw}%</span>
                                <span style={{ color: 'var(--color-usd)' }}>달러: {sub.weights.usd}%</span>
                                <span style={{ color: 'var(--color-jpy)' }}>엔화: {sub.weights.jpy}%</span>
                              </div>
                              {/* Strategy bar */}
                              <div className="mini-portfolio">
                                <div className="mini-bar krw" style={{ width: `${sub.weights.krw}%` }}></div>
                                <div className="mini-bar usd" style={{ width: `${sub.weights.usd}%` }}></div>
                                <div className="mini-bar jpy" style={{ width: `${sub.weights.jpy}%` }}></div>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>투자 전략: <strong>{sub.strategyType}</strong></span>
                              <p className="reason-quote">
                                {sub.reason || '(근거 미작성)'}
                              </p>
                            </div>
                          ) : isSub && sub ? (
                            <div style={{ marginTop: '1rem', padding: '1rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                              🔒 제출된 투자 내역 숨김 상태
                            </div>
                          ) : (
                            <div style={{ marginTop: '1rem', padding: '1rem', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                              ⏳ 포트폴리오를 조정하는 중...
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Show previous round statistics if closed */}
              {roundStatus === 'closed' && currentRoundScenario && (
                <div className="glass-card">
                  <h3 style={{ marginBottom: '1rem' }}>{currentRoundNum}라운드 환율 변동 정산 결과</h3>
                  
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>모둠명</th>
                          <th>리밸런싱 전 자산</th>
                          <th>포트폴리오 비중 (원/달/엔)</th>
                          <th>리밸런싱 후 자산</th>
                          <th>라운드 수익률</th>
                          <th>뉴스 점수</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teams.map(tName => {
                          const team = teamsData[tName];
                          const sub = team?.submissions.find(s => s.round === currentRoundNum);
                          if (!sub) return null;
                          const diff = sub.assetAfter - sub.assetBefore;
                          const returnRate = ((diff / sub.assetBefore) * 100).toFixed(2);
                          
                          return (
                            <tr key={tName}>
                              <td style={{ fontWeight: 800 }}>{tName}</td>
                              <td style={{ color: 'var(--text-secondary)' }}>{formatKRW(sub.assetBefore)}</td>
                              <td>
                                <span style={{ color: 'var(--color-krw)' }}>{sub.weights.krw}</span>/
                                <span style={{ color: 'var(--color-usd)' }}>{sub.weights.usd}</span>/
                                <span style={{ color: 'var(--color-jpy)' }}>{sub.weights.jpy}</span>
                              </td>
                              <td style={{ fontWeight: 700 }}>{formatKRW(sub.assetAfter)}</td>
                              <td className={diff >= 0 ? 'trend-up' : 'trend-down'} style={{ fontWeight: 700 }}>
                                {diff >= 0 ? '+' : ''}{returnRate}%
                              </td>
                              <td>
                                <span className="badge badge-success">{sub.newsScore}점</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. SCENARIO LOG TAB */}
          {activeTab === 'history' && (
            <div className="glass-card">
              <h3 style={{ marginBottom: '1.25rem' }}>전체 환율 파도타기 시나리오 로그</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {exchangeRounds.map(r => {
                  const isUnlocked = currentRoundNum >= r.id;
                  return (
                    <div 
                      key={r.id} 
                      style={{ 
                        padding: '1.25rem', 
                        borderRadius: '0.75rem', 
                        background: 'rgba(15, 23, 42, 0.4)', 
                        border: `1px solid ${currentRoundNum === r.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
                        opacity: isUnlocked ? 1 : 0.4 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{r.id}라운드 시나리오 {currentRoundNum === r.id ? ' (진행중)' : ''}</span>
                        <span className="badge badge-primary">
                          {isUnlocked ? '해제됨' : '🔒 잠김'}
                        </span>
                      </div>
                      <h4 style={{ color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>{r.headline}</h4>
                      {isUnlocked && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <p style={{ marginBottom: '0.5rem' }}>{r.brief}</p>
                          <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '0.5rem', width: 'fit-content' }}>
                            <span>변동률:</span>
                            <span style={{ color: 'var(--color-krw)' }}>원화(KRW) 0.0%</span>
                            <span style={{ color: r.rateChanges.usd >= 0 ? 'var(--color-danger)' : 'var(--color-info)' }}>달러(USD) {r.rateChanges.usd >= 0 ? '+' : ''}{r.rateChanges.usd}%</span>
                            <span style={{ color: r.rateChanges.jpy >= 0 ? 'var(--color-danger)' : 'var(--color-info)' }}>엔화(JPY) {r.rateChanges.jpy >= 0 ? '+' : ''}{r.rateChanges.jpy}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. LEADERBOARD TAB */}
          {activeTab === 'leaderboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-card">
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={24} style={{ color: 'var(--color-krw)' }} /> 글로벌 자산가 랭킹 리더보드
                </h3>
                
                {teams.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' }}>기록이 존재하지 않습니다.</p>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: '80px' }}>순위</th>
                          <th>모둠명</th>
                          <th>최종 자산 가치</th>
                          <th>누적 수익률</th>
                          <th>누적 뉴스 해석 점수 (350점 만점)</th>
                          <th>선호 투자 성향</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getRankedTeams().map((t, idx) => (
                          <tr key={t.name} style={{ background: idx === 0 ? 'rgba(251, 191, 36, 0.05)' : '' }}>
                            <td>
                              <span className={`rank-badge rank-${idx + 1}`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td style={{ fontWeight: 800, fontSize: '1.1rem' }}>{t.name}</td>
                            <td style={{ fontWeight: 800, color: 'var(--color-krw)' }}>{formatKRW(t.finalAsset)}</td>
                            <td className={t.totalReturn >= 0 ? 'trend-up' : 'trend-down'} style={{ fontWeight: 700 }}>
                              {t.totalReturn >= 0 ? '+' : ''}{t.totalReturn.toFixed(2)}%
                            </td>
                            <td>
                              <span className="badge badge-primary" style={{ fontSize: '0.9rem' }}>{t.totalNewsScore} 점</span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>{t.dominantStrategy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Reflections cards grid */}
              <div className="glass-card">
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} style={{ color: 'var(--color-info)' }} /> 모둠별 최종 성찰 및 피드백 일지
                </h3>
                <div className="submissions-grid">
                  {getRankedTeams().map((t) => (
                    <div key={t.name} className="submission-team-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 800 }}>{t.name}</span>
                        <span className="badge badge-success">수익률: {t.totalReturn.toFixed(1)}%</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>성찰 일지 내용:</span>
                      <p style={{ 
                        fontSize: '0.9rem', 
                        fontStyle: 'italic', 
                        lineHeight: '1.5', 
                        color: t.reflection === '미제출' ? 'var(--text-muted)' : 'var(--text-primary)',
                        padding: '0.5rem',
                        background: 'rgba(0,0,0,0.1)',
                        borderRadius: '0.5rem',
                        marginTop: '0.25rem',
                        minHeight: '60px'
                      }}>
                        "{t.reflection}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
