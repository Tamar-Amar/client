// src/recoil/storeAtom.ts
import { atom } from 'recoil';

export const storeListState = atom<string[]>({
  key: 'storeListState',
  default: [],
});
