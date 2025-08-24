import { useRecoilValue, useSetRecoilState } from 'recoil';
import { currentProjectState } from '../recoil/storeAtom';
import { projectNames } from '../utils/projectUtils';

export const useCurrentProject = () => {
  const currentProject = useRecoilValue(currentProjectState);
  const setCurrentProject = useSetRecoilState(currentProjectState);

  const getCurrentProjectName = () => {
    return projectNames[currentProject] || `פרויקט ${currentProject}`;
  };

  const getCurrentProjectCode = () => {
    return currentProject;
  };

  const setCurrentProjectCode = (projectCode: number) => {
    setCurrentProject(projectCode);
  };

  return {
    currentProject,
    currentProjectName: getCurrentProjectName(),
    setCurrentProject: setCurrentProjectCode,
    getCurrentProjectName,
    getCurrentProjectCode
  };
};
