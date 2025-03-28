// components/ChessGame.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ref, set, onValue, update } from 'firebase/database';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { db } from '../lib/firebase';

export default function ChessGame({ user, gameId }) {
  const [game, setGame] = useState(new Chess());
  const [boardPosition, setBoardPosition] = useState('start');
  const [players, setPlayers] = useState({});
  const [status, setStatus] = useState('');
  const [color, setColor] = useState(null);
  const router = useRouter();
  
//  console.log(user);

//   
  useEffect(() => {
    const gameRef = ref(db, `games/${gameId}`);
    onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      console.log(data);
      if (!data) {
        router.push('/');
        return;
      }
      setPlayers(data.players || {});
      setStatus(data.status || '');
      setBoardPosition(data.fen);
      if (!color && data.players[user.uid]) setColor(data.players[user.uid].color);
      game.load(data.fen);

      // Join game if not already in it
      if (data.status === 'waiting' && !data.players[user.uid]) {
        update(gameRef, {
          players: { ...data.players, [user.uid]: { name: user.displayName || 'Player', color: 'b' } },
          status: 'active',
        });
      }
    });
  }, [gameId, user, color, router]);

  const onDrop = (sourceSquare, targetSquare) => {
    if (status !== 'active' || game.turn() !== color) return false;
    const move = game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (move === null) return false;

    update(ref(db, `games/${gameId}`), {
      fen: game.fen(),
      turn: game.turn(),
      status: game.isGameOver() ? 'over' : 'active',
    });
    return true;
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <p>Game ID: {gameId}</p>
      <p>Players: {Object.values(players).map((p) => p.name).join(' vs ')}</p>
      <p>Status: {status === 'waiting' ? 'Waiting for opponent...' : status === 'over' ? 'Game Over' : 'Playing'}</p>
      {status !== 'waiting' && (
        <Chessboard
          position={boardPosition}
          onPieceDrop={onDrop}
          boardOrientation={color === 'w' ? 'white' : 'black'}
        />
      )}
      <button onClick={() => router.push('/')}>Leave Game</button>
    </div>
  );
}