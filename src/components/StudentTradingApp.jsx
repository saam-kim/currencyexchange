import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  HelpCircle, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  LogOut,
  RefreshCw,
  Award,
  BookOpen,
  PieChart,
  Users
} from 'lucide-react';
import { exchangeRounds } from '../data/exchangeRounds';

export default function StudentTradingApp({ 
  roomCode, 
  teamName, 
  roomData, 
  teamsData, 
  submitWeights, 
  submitReflection,
  leaveRoom 
}) {
  const team = teamsData[teamName];
  const currentRoundNum = roomData?.currentRound || 1;
  const roundStatus = roomData?.roundStatus || 'waiting';
  const difficulty = roomData?.difficulty || 'standard';

  // Local state for portfolio slider
  const [weights, setWeights] = useState({ krw: 40, usd: 40, jpy: 20 });
  const [reason, setReason] = useState('');
  const [reflection, setReflection] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Sync state when round changes
  useEffect(() => {
    if (team) {
      setReason('');
      setFeedbackSubmitted(false);
      
      // Look if there's already a submission for the current round to restore state
      const currentSub = team.submissions.find(s => s.round === currentRoundNum);
      if (currentSub) {
        setWeights(currentSub.weights);
        setReason(currentSub.reason);
      } else {
        // Default weights: carry over last round's weights if available
        const lastSub = team.submissions.find(s => s.round === currentRoundNum - 1);
        if (lastSub) {
          setWeights(lastSub.weights);
        } else {
          setWeights({ krw: 40, usd: 40, jpy: 20 });
        }
      }
    }
  }, [currentRoundNum, team]);

  if (!team) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-card text-center" style={{ maxWidth: '400px' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
          <h3>오류 발생</h3>
          <p>모둠 정보를 불러올 수 없습니다. 다시 로그인해 주세요.</p>
          <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}>
            메인으로 이동
          </button>
        </div>
      </div>
    );
  }

  const currentRoundScenario = exchangeRounds.find(r => r.id === currentRoundNum);
  const sumWeights = weights.krw + weights.usd + weights.jpy;
  const isWeightValid = sumWeights === 100;

  // Handle slider changes
  const handleSliderChange = (currency, val) => {
    const value = parseInt(val) || 0;
    setWeights(prev => ({
      ...prev,
      [currency]: value
    }));
  };

  // Helper to balance weights
  const handleAutoBalance = () => {
    setWeights({ krw: 34, usd: 33, jpy: 33 });
  };

  const handleFillRemainder = (currency) => {
    const currentSumWithout = Object.keys(weights)
      .filter(k => k !== currency)
      .reduce((sum, key) => sum + weights[key], 0);
    const remainder = Math.max(0, 100 - currentSumWithout);
    setWeights(prev => ({
      ...prev,
      [currency]: remainder
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isWeightValid) return;
    if (!reason.trim()) {
      alert('예측 근거를 간략하게라도 작성해 주세요!');
      return;
    }
    
    submitWeights(roomCode, teamName, weights, reason);
  };

  const handleReflectionSubmit = (e) => {
    e.preventDefault();
    if (!reflection.trim()) {
      alert('성찰 일지를 작성해 주세요.');
      return;
    }
    submitReflection(roomCode, teamName, reflection);
    setFeedbackSubmitted(true);
  };

  const formatKRW = (val) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })
      .format(val)
      .replace('₩', '') + ' 원';
  };

  const handleExit = () => {
    leaveRoom();
    localStorage.removeItem('exchange_game_current_role');
    localStorage.removeItem('exchange_game_current_code');
    window.location.reload();
  };

  // Rendering Helper: News display based on difficulty
  const renderNews = () => {
    if (!currentRoundScenario) return null;

    if (difficulty === 'evaluation') {
      // Evaluation mode: Headlines only
      return (
        <div className="news-container">
          <div className="glass-card news-card">
            <span className="badge badge-danger" style={{ marginBottom: '0.5rem' }}>핵심 뉴스</span>
            <h4 className="news-title">{currentRoundScenario.headline}</h4>
            <p className="news-body" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
              ⚠️ 평가형 모드입니다. 상세 내용과 힌트가 제공되지 않으므로, 경제적 추론을 바탕으로 의사결정을 내려주세요.
            </p>
          </div>
          {currentRoundScenario.comparisonNews && (
            <div className="glass-card news-card comparison">
              <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>관련 뉴스</span>
              <h4 className="news-title">{currentRoundScenario.comparisonNews.headline}</h4>
            </div>
          )}
        </div>
      );
    }

    if (difficulty === 'standard') {
      // Standard mode: Headline, Brief, Tags (No Hints)
      return (
        <div className="news-container">
          <div className="glass-card news-card">
            <span className="badge badge-danger" style={{ marginBottom: '0.5rem' }}>핵심 뉴스</span>
            <h4 className="news-title">{currentRoundScenario.headline}</h4>
            <p className="news-body">{currentRoundScenario.brief}</p>
            <div className="tag-list">
              {currentRoundScenario.conceptTags.map((tag, i) => (
                <span key={i} className="tag">#{tag}</span>
              ))}
            </div>
          </div>
          {currentRoundScenario.comparisonNews && (
            <div className="glass-card news-card comparison">
              <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>비교 뉴스</span>
              <h4 className="news-title">{currentRoundScenario.comparisonNews.headline}</h4>
              <p className="news-body">{currentRoundScenario.comparisonNews.brief}</p>
              <div className="tag-list">
                {currentRoundScenario.comparisonNews.conceptTags.map((tag, i) => (
                  <span key={i} className="tag">#{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Basic mode: Show everything (Headline, Brief, Tags, and Hint)
    return (
      <div className="news-container">
        <div className="glass-card news-card">
          <span className="badge badge-danger" style={{ marginBottom: '0.5rem' }}>핵심 뉴스</span>
          <h4 className="news-title">{currentRoundScenario.headline}</h4>
          <p className="news-body">{currentRoundScenario.brief}</p>
          <div className="tag-list">
            {currentRoundScenario.conceptTags.map((tag, i) => (
              <span key={i} className="tag">#{tag}</span>
            ))}
          </div>
          {currentRoundScenario.hint && (
            <div className="hint-box">
              <span style={{ fontWeight: 800, display: 'block', marginBottom: '0.25rem' }}>💡 환율 힌트 교과서 가이드</span>
              {currentRoundScenario.hint}
            </div>
          )}
        </div>

        {currentRoundScenario.comparisonNews && (
          <div className="glass-card news-card comparison">
            <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>비교 뉴스</span>
            <h4 className="news-title">{currentRoundScenario.comparisonNews.headline}</h4>
            <p className="news-body">{currentRoundScenario.comparisonNews.brief}</p>
            <div className="tag-list">
              {currentRoundScenario.comparisonNews.conceptTags.map((tag, i) => (
                <span key={i} className="tag">#{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Header bar */}
      <div className="header-bar">
        <div className="logo-section">
          <h1>{roomData?.code ? `수업코드: ${roomData.code}` : '수업 대기 중'}</h1>
          <span>모둠: <strong style={{ color: 'var(--color-info)' }}>{teamName}</strong></span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="badge badge-primary">
            라운드: {roundStatus === 'finished' ? '게임 종료' : `${currentRoundNum} / 5`}
          </span>
          <button className="btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setShowExitConfirm(true)}>
            <LogOut size={16} /> 나가기
          </button>
        </div>
      </div>

      {/* 1. Lobby state before game starts */}
      {roundStatus === 'waiting' && (
        <div className="glass-card waiting-screen">
          <Users size={64} style={{ color: 'var(--color-primary)' }} />
          <div>
            <h2>환율 시뮬레이션 방 입장 완료!</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              교사가 게임을 시작할 때까지 잠시 대기해 주세요.
            </p>
          </div>
          <div className="loader-ring"></div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '0.75rem', width: '100%', maxWidth: '360px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>참가한 다른 모둠 목록</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {roomData?.teams.map((t, idx) => (
                <span key={idx} className="badge badge-success" style={{ textTransform: 'none' }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Open trading round */}
      {roundStatus === 'open' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Asset & Portfolio display */}
          <div className="grid-2">
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span className="asset-label">현재 우리 모둠의 총 자산 가치</span>
              <div className="asset-value">{formatKRW(team.currentAsset)}</div>
            </div>
            
            <div className="glass-card">
              <span className="asset-label" style={{ display: 'block', marginBottom: '0.5rem' }}>현재 포트폴리오 비중</span>
              <div className="currency-allocations">
                <div className="allocation-chip krw">
                  <span>원화 (KRW)</span>
                  <div className="value" style={{ color: 'var(--color-krw)' }}>{weights.krw}%</div>
                </div>
                <div className="allocation-chip usd">
                  <span>달러화 (USD)</span>
                  <div className="value" style={{ color: 'var(--color-usd)' }}>{weights.usd}%</div>
                </div>
                <div className="allocation-chip jpy">
                  <span>엔화 (JPY)</span>
                  <div className="value" style={{ color: 'var(--color-jpy)' }}>{weights.jpy}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Submitting weights state */}
          {!team.isSubmittedCurrentRound ? (
            <div className="grid-2">
              {/* Left Column: News Reader */}
              <div>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={20} style={{ color: 'var(--color-primary)' }} /> 뉴스 분석실
                </h3>
                {renderNews()}
              </div>

              {/* Right Column: Weight Sliders & Reason submission */}
              <form onSubmit={handleSubmit} className="glass-card">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PieChart size={20} style={{ color: 'var(--color-warning)' }} /> 자산 비중 리밸런싱
                </h3>

                <div className="weights-control-panel">
                  {/* KRW Slider */}
                  <div className="slider-row krw">
                    <span className="slider-label krw">원화 KRW</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={weights.krw}
                      onChange={(e) => handleSliderChange('krw', e.target.value)}
                    />
                    <div className="num-input-wrap">
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={weights.krw}
                        onChange={(e) => handleSliderChange('krw', e.target.value)}
                      />
                      <span>%</span>
                    </div>
                  </div>

                  {/* USD Slider */}
                  <div className="slider-row usd">
                    <span className="slider-label usd">달러 USD</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={weights.usd}
                      onChange={(e) => handleSliderChange('usd', e.target.value)}
                    />
                    <div className="num-input-wrap">
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={weights.usd}
                        onChange={(e) => handleSliderChange('usd', e.target.value)}
                      />
                      <span>%</span>
                    </div>
                  </div>

                  {/* JPY Slider */}
                  <div className="slider-row jpy">
                    <span className="slider-label jpy">엔화 JPY</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={weights.jpy}
                      onChange={(e) => handleSliderChange('jpy', e.target.value)}
                    />
                    <div className="num-input-wrap">
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={weights.jpy}
                        onChange={(e) => handleSliderChange('jpy', e.target.value)}
                      />
                      <span>%</span>
                    </div>
                  </div>
                </div>

                {/* Validation and Helper Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <button type="button" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={handleAutoBalance}>
                    3분할 균등 맞춤
                  </button>
                  <button type="button" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleFillRemainder('krw')}>
                    남는 비중 원화 채우기
                  </button>
                </div>

                <div className={`weights-verifier ${isWeightValid ? 'valid' : 'invalid'}`}>
                  <span>포트폴리오 비중 합계:</span>
                  <div className={`total-sum ${isWeightValid ? 'valid' : 'invalid'}`}>
                    {sumWeights} / 100%
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: '1.5rem' }}>
                  <label>투자 및 예측 근거 작성 (인물/금리/수출/안전자산 등 핵심 단어 포함 권장)</label>
                  <textarea 
                    className="reflection-box" 
                    placeholder="이 포트폴리오를 구성한 이유를 경제 원리와 연결하여 작성해 주세요. (예: 미국의 기준금리 인상으로 달러 가치 상승이 예상되므로 달러 비중을 늘렸습니다.)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: '100%', height: '3.5rem' }}
                  disabled={!isWeightValid}
                >
                  최종 포트폴리오 제출하기
                </button>
              </form>
            </div>
          ) : (
            // Wait screen after submission
            <div className="glass-card waiting-screen">
              <CheckCircle size={64} style={{ color: 'var(--color-success)' }} />
              <div>
                <h2>{currentRoundNum}라운드 제출 완료!</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  교사 대시보드에서 라운드가 종료되고 결과가 집계될 때까지 잠시만 기다려 주세요.
                </p>
              </div>
              <div className="loader-ring"></div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '0.75rem', width: '100%', maxWidth: '360px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>제출한 우리 모둠 전략:</span>
                <p style={{ marginTop: '0.5rem' }}>
                  KRW {weights.krw}% | USD {weights.usd}% | JPY {weights.jpy}%
                </p>
                <p className="reason-quote" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  {reason}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Closed Round: View Results and Feedback */}
      {roundStatus === 'closed' && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          <div className="feedback-header">
            <div>
              <span className="badge badge-warning" style={{ marginBottom: '0.5rem' }}>라운드 종료 피드백</span>
              <h2>{currentRoundNum}라운드 결과 통계</h2>
            </div>
            <div className="loader-ring" style={{ width: '32px', height: '32px', borderWidth: '3px' }}></div>
          </div>

          {/* Rates changes grid */}
          <div className="feedback-grid">
            <div className="feedback-item">
              <span style={{ fontWeight: 500, display: 'block', fontSize: '0.9rem' }}>원화 KRW 변동률</span>
              <div className="trend-arrow" style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>- (기준)</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>0.0%</span>
            </div>
            <div className="feedback-item">
              <span style={{ fontWeight: 500, display: 'block', fontSize: '0.9rem' }}>달러 USD 변동률</span>
              <div className={`trend-arrow ${currentRoundScenario?.rateChanges.usd >= 0 ? 'trend-up' : 'trend-down'}`} style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>
                {currentRoundScenario?.rateChanges.usd >= 0 ? '▲' : '▼'} {Math.abs(currentRoundScenario?.rateChanges.usd)}%
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>대 원화 환율 기준</span>
            </div>
            <div className="feedback-item">
              <span style={{ fontWeight: 500, display: 'block', fontSize: '0.9rem' }}>엔화 JPY 변동률</span>
              <div className={`trend-arrow ${currentRoundScenario?.rateChanges.jpy >= 0 ? 'trend-up' : 'trend-down'}`} style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>
                {currentRoundScenario?.rateChanges.jpy >= 0 ? '▲' : '▼'} {Math.abs(currentRoundScenario?.rateChanges.jpy)}%
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>대 원화 환율 기준</span>
            </div>
          </div>

          {/* Personal asset changes */}
          <div className="feedback-details">
            <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>우리 모둠 손익 통계</h4>
            
            {(() => {
              const sub = team.submissions.find(s => s.round === currentRoundNum);
              if (!sub) return <p>제출 정보를 불러올 수 없습니다.</p>;
              
              const diff = sub.assetAfter - sub.assetBefore;
              const rate = ((diff / sub.assetBefore) * 100).toFixed(2);
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>라운드 이전 자산:</span>
                    <span>{formatKRW(sub.assetBefore)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>라운드 이후 자산:</span>
                    <span style={{ fontWeight: 800 }}>{formatKRW(sub.assetAfter)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>평가 손익:</span>
                    <span className={`trend-arrow ${diff >= 0 ? 'trend-up' : 'trend-down'}`} style={{ fontWeight: 800, fontSize: '1.2rem' }}>
                      {diff >= 0 ? '+' : ''}{formatKRW(diff)} ({diff >= 0 ? '+' : ''}{rate}%)
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h5 style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Award size={16} style={{ color: 'var(--color-krw)' }} /> 뉴스 해석 및 전략 평가
                      </h5>
                      <span className="badge badge-success" style={{ fontSize: '0.9rem' }}>
                        {sub.newsScore} 점 / 70점 만점
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      💡 예측 근거의 개념어 포함도 및 환율 추세와 비중의 일치 여부로 평가됩니다.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {sub.keywordsFound.length > 0 ? (
                        sub.keywordsFound.map((kw, i) => (
                          <span key={i} className="badge badge-primary" style={{ fontSize: '0.75rem', textTransform: 'none' }}>
                            ✓ {kw} (+10)
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          검출된 경제 핵심 키워드가 없습니다. (자유 근거 또는 키워드 누락)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>라운드 뉴스 해설</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              {currentRoundScenario?.feedback}
            </p>
          </div>

          <div className="badge badge-warning" style={{ display: 'block', width: '100%', padding: '1rem', borderRadius: '0.75rem', textTransform: 'none', textAlign: 'center' }}>
            📢 교사가 다음 라운드를 개시할 때까지 대기해 주세요.
          </div>
        </div>
      )}

      {/* 4. Game Over - Reflection & Final Leaderboard */}
      {roundStatus === 'finished' && (
        <div className="glass-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Award size={28} style={{ color: 'var(--color-krw)' }} /> 최종 시뮬레이션 보고서 작성
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            5라운드의 투자가 모두 끝났습니다! 최종 성적 집계 전, 수업 성찰 일지를 마저 작성해 주세요.
          </p>

          {!team.reflection && !feedbackSubmitted ? (
            <form onSubmit={handleReflectionSubmit}>
              <div className="input-group">
                <label style={{ fontWeight: 700 }}>최종 성찰 일지 작성</label>
                <textarea 
                  className="reflection-box" 
                  style={{ minHeight: '150px' }}
                  placeholder="게임 전반에 대한 소감, 가장 크게 손실/수익이 난 라운드와 그 원인 분석, 환율 변동과 국제 경제 뉴스의 상관성에 대해 배운 점을 서술형으로 3~4줄 이상 상세히 기술해 주세요."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                성찰 작성 완료 및 최종 리더보드 확인
              </button>
            </form>
          ) : (
            <div>
              <div className="badge badge-success" style={{ display: 'block', width: '100%', padding: '1rem', borderRadius: '0.75rem', textTransform: 'none', textAlign: 'center', marginBottom: '2rem' }}>
                🎉 성찰 일지가 제출되었습니다! 이제 교사 전자칠판 화면(리더보드)을 주시해 주시거나 아래에서 우리 결과를 확인하세요.
              </div>

              <div className="feedback-details">
                <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>우리 모둠의 최종 성적</h4>
                
                {(() => {
                  const finalAsset = team.currentAsset;
                  const totalReturn = ((finalAsset - 100000000) / 100000000) * 100;
                  const totalNewsScore = team.submissions.reduce((sum, s) => sum + (s.newsScore || 0), 0);
                  
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>최종 자산 가치:</span>
                        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-krw)' }}>{formatKRW(finalAsset)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>누적 수익률:</span>
                        <span className={`trend-arrow ${totalReturn >= 0 ? 'trend-up' : 'trend-down'}`} style={{ fontWeight: 800 }}>
                          {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>누적 뉴스 해석 점수:</span>
                        <span style={{ fontWeight: 800 }}>{totalNewsScore} 점 / 350점 만점</span>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>작성한 성찰 일지 내용:</span>
                        <p style={{ fontSize: '0.9rem', fontStyle: 'italic', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem' }}>
                          {team.reflection || reflection}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Display round by round summary */}
              <div>
                <h4 style={{ marginBottom: '1rem' }}>라운드별 선택 내역</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {team.submissions.map((sub, i) => (
                    <div key={i} style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.25rem' }}>
                        <span>{sub.round}라운드</span>
                        <span className={sub.assetAfter >= sub.assetBefore ? 'trend-up' : 'trend-down'}>
                          {sub.assetAfter >= sub.assetBefore ? '▲' : '▼'} {(((sub.assetAfter - sub.assetBefore) / sub.assetBefore) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                        <span>비중: KRW {sub.weights.krw}% / USD {sub.weights.usd}% / JPY {sub.weights.jpy}%</span>
                        <span>뉴스 점수: {sub.newsScore}점</span>
                      </div>
                      {sub.reason && <p className="reason-quote" style={{ marginTop: '0.25rem', fontSize: '0.8rem', padding: '0.4rem' }}>{sub.reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertCircle style={{ color: 'var(--color-danger)' }} /> 방 나가기 확인
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              정말로 수업방에서 나가시겠습니까? 진행 데이터는 브라우저에 임시 저장되지만, 수업 중 나가는 경우 리더보드 노출에 불이익이 생길 수 있습니다.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowExitConfirm(false)}>
                취소
              </button>
              <button className="btn-danger" style={{ flex: 1 }} onClick={handleExit}>
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
