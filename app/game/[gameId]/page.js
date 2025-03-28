// app/game/[gameId]/page.js
'use client';

import ChessGame from '@/components/ChessGame';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function GamePage ({ params }) {
  const { gameId } = params;
  const router = useRouter();
  const user = auth.currentUser; 

  if (!user) {
    router.push('/auth');
    return null;
  }

  return <ChessGame user={user} gameId={gameId} />;
}