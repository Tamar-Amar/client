// state/authState.ts
import { atom } from 'recoil';

export const userRoleState = atom({
  key: 'userRoleState', // מפתח ייחודי ל-Atom
  default: null as 'admin' | 'operator' | null, // תפקיד המשתמש: מנהל או מפעיל
});

export const userTokenState = atom({
  key: 'userTokenState', // מפתח ייחודי לטוקן
  default: null as string | null, // טוקן JWT
});
