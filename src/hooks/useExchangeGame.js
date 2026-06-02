import { useState, useEffect, useCallback } from 'react';
import { exchangeRounds, conceptKeywords } from '../data/exchangeRounds';

// Helper to generate 6-digit random code
const generateRoomCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export function useExchangeGame() {
  const [activeRoomCode, setActiveRoomCode] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [teamsData, setTeamsData] = useState({});
  const [availableRooms, setAvailableRooms] = useState([]);

  // Load all rooms from localStorage
  const refreshAvailableRooms = useCallback(() => {
    const rooms = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('exchange_game_room_')) {
        try {
          const room = JSON.parse(localStorage.getItem(key));
          rooms.push(room);
        } catch (e) {
          console.error('Error parsing room', key, e);
        }
      }
    }
    rooms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setAvailableRooms(rooms);
  }, []);

  // Load active room and teams data
  const loadRoom = useCallback((roomCode) => {
    if (!roomCode) return;
    const roomKey = `exchange_game_room_${roomCode}`;
    const teamsKey = `exchange_game_submissions_${roomCode}`;

    const rDataStr = localStorage.getItem(roomKey);
    const tDataStr = localStorage.getItem(teamsKey);

    if (rDataStr) {
      const rData = JSON.parse(rDataStr);
      setRoomData(rData);
      setActiveRoomCode(roomCode);
    } else {
      setRoomData(null);
      setActiveRoomCode(null);
    }

    if (tDataStr) {
      setTeamsData(JSON.parse(tDataStr));
    } else {
      setTeamsData({});
    }
  }, []);

  // Initialize available rooms
  useEffect(() => {
    refreshAvailableRooms();
  }, [refreshAvailableRooms]);

  // Sync state on localStorage change (Storage Event)
  useEffect(() => {
    const handleStorageChange = (e) => {
      refreshAvailableRooms();
      if (activeRoomCode) {
        if (e.key === `exchange_game_room_${activeRoomCode}` || e.key === `exchange_game_submissions_${activeRoomCode}`) {
          loadRoom(activeRoomCode);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeRoomCode, loadRoom, refreshAvailableRooms]);

  // Create room
  const createRoom = useCallback((difficulty = 'standard', pin = '1234') => {
    const code = generateRoomCode();
    const newRoom = {
      code,
      difficulty,
      pin,
      currentRound: 0, // 0 means waiting for teams to join/confirm
      roundStatus: 'waiting', // waiting, open, closed, finished
      teams: [],
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(`exchange_game_room_${code}`, JSON.stringify(newRoom));
    localStorage.setItem(`exchange_game_submissions_${code}`, JSON.stringify({}));

    setActiveRoomCode(code);
    setRoomData(newRoom);
    setTeamsData({});
    refreshAvailableRooms();
    return code;
  }, [refreshAvailableRooms]);

  // Check PIN
  const verifyRoomPin = useCallback((roomCode, pin) => {
    const roomKey = `exchange_game_room_${roomCode}`;
    const rDataStr = localStorage.getItem(roomKey);
    if (!rDataStr) return false;
    const rData = JSON.parse(rDataStr);
    return rData.pin === pin;
  }, []);

  // Join Room (Student)
  const joinRoom = useCallback((roomCode, teamName) => {
    const roomKey = `exchange_game_room_${roomCode}`;
    const teamsKey = `exchange_game_submissions_${roomCode}`;

    const rDataStr = localStorage.getItem(roomKey);
    if (!rDataStr) return { success: false, message: '존재하지 않는 수업 코드입니다.' };

    const rData = JSON.parse(rDataStr);
    if (rData.roundStatus !== 'waiting') {
      return { success: false, message: '이미 진행 중이거나 종료된 수업입니다.' };
    }

    if (rData.teams.includes(teamName)) {
      return { success: false, message: '이미 존재하는 모둠명입니다. 다른 이름을 사용해주세요.' };
    }

    // Update Room Teams list
    rData.teams.push(teamName);
    localStorage.setItem(roomKey, JSON.stringify(rData));

    // Update Teams Data
    const tDataStr = localStorage.getItem(teamsKey) || '{}';
    const tData = JSON.parse(tDataStr);
    tData[teamName] = {
      teamName,
      currentAsset: 100000000, // 100,000,000 KRW
      submissions: [], // details of decisions and results for each round
      reflection: '',
      isSubmittedCurrentRound: false,
      joinedAt: new Date().toISOString()
    };
    localStorage.setItem(teamsKey, JSON.stringify(tData));

    // Force local state update
    setRoomData(rData);
    setTeamsData(tData);
    setActiveRoomCode(roomCode);
    refreshAvailableRooms();

    // Trigger storage event manually for same window/tabs communication
    window.dispatchEvent(new Event('storage'));

    return { success: true };
  }, [refreshAvailableRooms]);

  // Confirm Teams and Start Game (Teacher)
  const startGame = useCallback((roomCode) => {
    const roomKey = `exchange_game_room_${roomCode}`;
    const rDataStr = localStorage.getItem(roomKey);
    if (!rDataStr) return;

    const rData = JSON.parse(rDataStr);
    rData.currentRound = 1;
    rData.roundStatus = 'open'; // Students can now trade

    localStorage.setItem(roomKey, JSON.stringify(rData));
    setRoomData(rData);
    window.dispatchEvent(new Event('storage'));
  }, []);

  // Submit weights (Student)
  const submitWeights = useCallback((roomCode, teamName, weights, reason) => {
    const roomKey = `exchange_game_room_${roomCode}`;
    const teamsKey = `exchange_game_submissions_${roomCode}`;

    const rDataStr = localStorage.getItem(roomKey);
    const tDataStr = localStorage.getItem(teamsKey);
    if (!rDataStr || !tDataStr) return { success: false, message: '방 정보를 찾을 수 없습니다.' };

    const rData = JSON.parse(rDataStr);
    if (rData.roundStatus !== 'open') {
      return { success: false, message: '현재 라운드 제출 기간이 아닙니다.' };
    }

    const tData = JSON.parse(tDataStr);
    const team = tData[teamName];
    if (!team) return { success: false, message: '해당 모둠 정보를 찾을 수 없습니다.' };

    // Check weights
    const sum = weights.krw + weights.usd + weights.jpy;
    if (sum !== 100) {
      return { success: false, message: '비중의 합계는 반드시 100%여야 합니다.' };
    }

    // Add or update current round submission info
    const roundNum = rData.currentRound;
    const existingIndex = team.submissions.findIndex(s => s.round === roundNum);

    const submissionData = {
      round: roundNum,
      weights,
      reason,
      assetBefore: team.currentAsset,
      assetAfter: team.currentAsset, // will be updated when round is closed
      newsScore: 0,
      keywordsFound: [],
      strategyType: getStrategyType(weights)
    };

    if (existingIndex > -1) {
      team.submissions[existingIndex] = submissionData;
    } else {
      team.submissions.push(submissionData);
    }

    team.isSubmittedCurrentRound = true;
    localStorage.setItem(teamsKey, JSON.stringify(tData));

    setTeamsData(tData);
    window.dispatchEvent(new Event('storage'));

    return { success: true };
  }, []);

  // Classify strategy based on weights
  const getStrategyType = (weights) => {
    const { krw, usd, jpy } = weights;
    if (krw >= 80) return '원화 안전 추구형';
    if (usd >= 80) return '달러 집중 투자형';
    if (jpy >= 80) return '엔화 집중 투자형';
    if (krw > 40 && usd > 40) return '원-달러 양호형';
    if (usd > 40 && jpy > 40) return '외화 자산 선호형';
    if (krw >= 30 && usd >= 30 && jpy >= 30) return '삼분할 분산 투자형';
    return '맞춤 포트폴리오형';
  };

  // Close Round & Process Rates (Teacher)
  const closeRound = useCallback((roomCode) => {
    const roomKey = `exchange_game_room_${roomCode}`;
    const teamsKey = `exchange_game_submissions_${roomCode}`;

    const rDataStr = localStorage.getItem(roomKey);
    const tDataStr = localStorage.getItem(teamsKey);
    if (!rDataStr || !tDataStr) return;

    const rData = JSON.parse(rDataStr);
    const tData = JSON.parse(tDataStr);
    const roundNum = rData.currentRound;
    const roundScenario = exchangeRounds.find(r => r.id === roundNum);

    if (!roundScenario) return;

    // Process each team's assets and scores
    rData.teams.forEach(teamName => {
      const team = tData[teamName];
      if (!team) return;

      let sub = team.submissions.find(s => s.round === roundNum);
      // If team didn't submit, carry over previous weights or default to 100% KRW
      if (!sub) {
        const lastSub = team.submissions.find(s => s.round === roundNum - 1);
        const defaultWeights = lastSub ? lastSub.weights : { krw: 100, usd: 0, jpy: 0 };
        sub = {
          round: roundNum,
          weights: defaultWeights,
          reason: '(시간 초과로 인한 자동 제출)',
          assetBefore: team.currentAsset,
          assetAfter: team.currentAsset,
          newsScore: 0,
          keywordsFound: [],
          strategyType: getStrategyType(defaultWeights)
        };
        team.submissions.push(sub);
      }

      // Calculate asset changes
      const w = sub.weights;
      const rates = roundScenario.rateChanges; // e.g. { krw: 0, usd: 3.8, jpy: -1.1 }

      // Formula: New Asset = Old Asset * (krw% * (1 + Rkrw/100) + usd% * (1 + Rusd/100) + jpy% * (1 + Rjpy/100))
      const krwFactor = (w.krw / 100) * (1 + rates.krw / 100);
      const usdFactor = (w.usd / 100) * (1 + rates.usd / 100);
      const jpyFactor = (w.jpy / 100) * (1 + rates.jpy / 100);

      const multiplier = krwFactor + usdFactor + jpyFactor;
      const assetBefore = team.currentAsset;
      const assetAfter = Math.round(assetBefore * multiplier);

      sub.assetBefore = assetBefore;
      sub.assetAfter = assetAfter;
      team.currentAsset = assetAfter;

      // Calculate News Analysis Score (Keyword grading)
      const reasonText = sub.reason || '';
      const keywordsFound = [];
      let keywordScore = 0;

      conceptKeywords.forEach(ck => {
        // If keyword applies to this round
        if (ck.rounds.includes(roundNum)) {
          // Check if reason text contains the keyword (case-insensitive)
          const regex = new RegExp(ck.keyword, 'i');
          if (regex.test(reasonText)) {
            keywordsFound.push(ck.keyword);
            keywordScore += ck.points;
          }
        }
      });

      // Cap keyword score at 50 per round
      const finalKeywordScore = Math.min(keywordScore, 50);

      // Check if they placed their portfolio correctly (Bonus +20)
      // E.g. which asset rose the most?
      let bestAsset = 'krw';
      let maxRate = rates.krw;
      if (rates.usd > maxRate) {
        bestAsset = 'usd';
        maxRate = rates.usd;
      }
      if (rates.jpy > maxRate) {
        bestAsset = 'jpy';
        maxRate = rates.jpy;
      }

      let bonusScore = 0;
      // If they allocated the highest weight to the best asset, or if the best asset has >= 40% allocation
      const bestAssetWeight = w[bestAsset];
      const otherWeights = Object.keys(w).filter(k => k !== bestAsset).map(k => w[k]);
      const isHighestWeight = otherWeights.every(ow => bestAssetWeight >= ow);

      if (isHighestWeight && bestAssetWeight > 0) {
        bonusScore = 20; // Correctly prioritized the best performing asset
      } else if (bestAssetWeight >= 40) {
        bonusScore = 15; // Strongly allocated to the best asset
      }

      sub.newsScore = finalKeywordScore + bonusScore;
      sub.keywordsFound = keywordsFound;
    });

    rData.roundStatus = 'closed'; // Round processed, students view results
    localStorage.setItem(roomKey, JSON.stringify(rData));
    localStorage.setItem(teamsKey, JSON.stringify(tData));

    setRoomData(rData);
    setTeamsData(tData);
    window.dispatchEvent(new Event('storage'));
  }, []);

  // Advance to Next Round (Teacher)
  const nextRound = useCallback((roomCode) => {
    const roomKey = `exchange_game_room_${roomCode}`;
    const teamsKey = `exchange_game_submissions_${roomCode}`;

    const rDataStr = localStorage.getItem(roomKey);
    const tDataStr = localStorage.getItem(teamsKey);
    if (!rDataStr || !tDataStr) return;

    const rData = JSON.parse(rDataStr);
    const tData = JSON.parse(tDataStr);

    if (rData.currentRound >= 5) {
      // End game
      rData.roundStatus = 'finished';
    } else {
      rData.currentRound += 1;
      rData.roundStatus = 'open';

      // Reset team submission status for the new round
      rData.teams.forEach(teamName => {
        if (tData[teamName]) {
          tData[teamName].isSubmittedCurrentRound = false;
        }
      });
    }

    localStorage.setItem(roomKey, JSON.stringify(rData));
    localStorage.setItem(teamsKey, JSON.stringify(tData));

    setRoomData(rData);
    setTeamsData(tData);
    window.dispatchEvent(new Event('storage'));
  }, []);

  // Submit Final Reflection (Student)
  const submitReflection = useCallback((roomCode, teamName, reflection) => {
    const teamsKey = `exchange_game_submissions_${roomCode}`;
    const tDataStr = localStorage.getItem(teamsKey);
    if (!tDataStr) return { success: false, message: '모둠 데이터를 찾을 수 없습니다.' };

    const tData = JSON.parse(tDataStr);
    if (!tData[teamName]) return { success: false, message: '모둠 정보를 찾을 수 없습니다.' };

    tData[teamName].reflection = reflection;
    localStorage.setItem(teamsKey, JSON.stringify(tData));

    setTeamsData(tData);
    window.dispatchEvent(new Event('storage'));
    return { success: true };
  }, []);

  // Delete/Clear room
  const deleteRoom = useCallback((roomCode) => {
    localStorage.removeItem(`exchange_game_room_${roomCode}`);
    localStorage.removeItem(`exchange_game_submissions_${roomCode}`);
    if (activeRoomCode === roomCode) {
      setActiveRoomCode(null);
      setRoomData(null);
      setTeamsData({});
    }
    refreshAvailableRooms();
    window.dispatchEvent(new Event('storage'));
  }, [activeRoomCode, refreshAvailableRooms]);

  // Load a room by code
  const enterRoom = useCallback((roomCode) => {
    loadRoom(roomCode);
  }, [loadRoom]);

  // Leave current room in state
  const leaveRoom = useCallback(() => {
    setActiveRoomCode(null);
    setRoomData(null);
    setTeamsData({});
  }, []);

  return {
    activeRoomCode,
    roomData,
    teamsData,
    availableRooms,
    createRoom,
    verifyRoomPin,
    joinRoom,
    startGame,
    submitWeights,
    closeRound,
    nextRound,
    submitReflection,
    deleteRoom,
    enterRoom,
    leaveRoom,
    refreshRooms: refreshAvailableRooms
  };
}
