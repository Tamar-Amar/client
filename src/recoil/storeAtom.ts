// state/authState.ts
import { atom } from 'recoil';

export const userRoleState = atom({
  key: 'userRoleState', 
  default: null as 'admin' | 'operator' | null, 
});

export const userTokenState = atom({
  key: 'userTokenState', 
  default: null as string | null,
});
