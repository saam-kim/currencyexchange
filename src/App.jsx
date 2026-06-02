import React, { useEffect, useState } from 'react';
import LandingPage from './components/LandingPage';
import StudentTradingApp from './components/StudentTradingApp';
import TeacherDashboard from './components/TeacherDashboard';
import { useExchangeGame } from './hooks/useExchangeGame';
import './styles.css';

export default function App() {
  const {
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
    leaveRoom
  } = useExchangeGame();

  const [role, setRole] = useState(null);
  const [code, setCode] = useState(null);
  const [teamName, setTeamName] = useState(null);

  // Initialize role and code from localStorage on mount
  useEffect(() => {
    const storedRole = localStorage.getItem('exchange_game_current_role');
    const storedCode = localStorage.getItem('exchange_game_current_code');

    if (storedRole === 'teacher' && storedCode) {
      setRole(storedRole);
      setCode(storedCode);
      enterRoom(storedCode);
    } else {
      // Clear student storage leftovers on fresh load to prevent stuck states
      localStorage.removeItem('exchange_game_current_role');
      localStorage.removeItem('exchange_game_current_code');
      localStorage.removeItem('exchange_game_current_team');
    }
  }, [enterRoom]);

  // Handle joining as a student with proper local state setting
  const handleJoinRoom = (roomCode, team) => {
    const res = joinRoom(roomCode, team);
    if (res.success) {
      localStorage.setItem('exchange_game_current_role', 'student');
      localStorage.setItem('exchange_game_current_code', roomCode);
      localStorage.setItem('exchange_game_current_team', team);
      setRole('student');
      setCode(roomCode);
      setTeamName(team);
    }
    return res;
  };

  // Render correct page
  if (role === 'teacher' && code) {
    return (
      <TeacherDashboard
        roomCode={code}
        roomData={roomData}
        teamsData={teamsData}
        startGame={startGame}
        closeRound={closeRound}
        nextRound={nextRound}
        deleteRoom={deleteRoom}
        leaveRoom={leaveRoom}
      />
    );
  }

  if (role === 'student' && code && teamName) {
    return (
      <StudentTradingApp
        roomCode={code}
        teamName={teamName}
        roomData={roomData}
        teamsData={teamsData}
        submitWeights={submitWeights}
        submitReflection={submitReflection}
        leaveRoom={leaveRoom}
      />
    );
  }

  // Otherwise, render landing page
  return (
    <LandingPage
      createRoom={createRoom}
      joinRoom={handleJoinRoom}
      availableRooms={availableRooms}
      enterRoom={enterRoom}
      deleteRoom={deleteRoom}
      verifyRoomPin={verifyRoomPin}
    />
  );
}
