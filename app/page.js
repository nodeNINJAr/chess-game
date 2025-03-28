// app/page.js
'use client'; // Client component since it uses hooks

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { onValue, ref, set, update } from 'firebase/database';
import { db } from '../lib/firebase';

export default function Home() {
  const [user, setUser] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) setUser(u);
      else router.push('/auth');
    });
    return () => unsubscribe();
  }, [router]);

  const createGame = () => {
    if (!user || !playerName) return;
    const newGameId = uuidv4();
    const gameRef = ref(db, `games/${newGameId}`);
    set(gameRef, {
      players: { [user.uid]: { name: playerName, color: 'w' } },
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      status: 'waiting',
      turn: 'w',
    });
    router.push(`/game/${newGameId}`);
  };

  const joinGame = () => {
    if (!user || !playerName || !gameId) return;

    const gameRef = ref(db, `games/${gameId}`);
    // Check game state and join
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        alert('Game not found!');
        return;
      }
      if (data.status !== 'waiting') {
        alert('Game is already active or over!');
        return;
      }
      if (data.players[user.uid]) {
        // User is already in the game, just navigate
        router.push(`/game/${gameId}`);
        return;
      }

      // Add the player and update status
      update(gameRef, {
        players: {
          ...data.players,
          [user.uid]: { name: playerName, color: 'b' }, // Join as black
        },
        status: 'active',
      }).then(() => {
        router.push(`/game/${gameId}`);
      }).catch((error) => {
        console.error('Error joining game:', error);
        alert('Failed to join game!');
      });
    }, { onlyOnce: true }); 
  };

  if (!user) return null; // Redirecting to /auth



  // 
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Chess Game</h1>
      <input
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="Your name"
      />
      <button onClick={createGame} disabled={!playerName}>
        Create Game
      </button>
      <input
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
        placeholder="Enter Game ID"
      />
      <button className='cursor-pointer' onClick={joinGame} disabled={!playerName || !gameId}>
        Join Game
      </button>
    </div>
  );
}