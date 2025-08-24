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

export const currentProjectState = atom<number>({
  key: "currentProjectState",
  default: parseInt(localStorage.getItem("currentProject") || "4"),
  effects_UNSTABLE: [
    ({ onSet }) => {
      onSet((newProject) => {
        localStorage.setItem("currentProject", newProject.toString());
      });
    },
  ],
});
