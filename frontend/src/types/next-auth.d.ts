import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string;
    email: string;
    role: 'GAME_MASTER' | 'PLAYER' | 'OBSERVER';
    squadId: string | null;
  }

  interface Session {
    user: User;
    token: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name: string;
    email: string;
    role: 'GAME_MASTER' | 'PLAYER' | 'OBSERVER';
    squadId: string | null;
  }
}