import { atom } from "recoil";

export const userTokenState = atom<string | null>({
  key: "userTokenState",
  default: localStorage.getItem("token"),
  effects_UNSTABLE: [
    ({ onSet }) => {
      onSet((newToken) => {
        if (newToken) {
          localStorage.setItem("token", newToken);
        } else {
          localStorage.removeItem("token");
        }
      });
    },
  ],
});

export const userRoleState = atom<string | null>({
  key: "userRoleState",
  default: localStorage.getItem("role"), 
  effects_UNSTABLE: [
    ({ onSet }) => {
      onSet((newRole) => {
        if (newRole) {
          localStorage.setItem("role", newRole);
        } else {
          localStorage.removeItem("role");
        }
      });
    },
  ],
});
