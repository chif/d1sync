import { Action } from 'redux';
import { isUndefined } from 'util';

export type PlaytestBaseState = {
  branchName: string;
  buildName: string;
};

export function findStateInArray(
  inArray: Array<PlaytestBaseState>,
  inStateToFind: PlaytestBaseState
) {
  return inArray.find(
    element =>
      element.branchName === inStateToFind.branchName &&
      element.buildName === inStateToFind.buildName
  );
}

export function findOrAddStateInArray(
  inArray: Array<PlaytestBaseState>,
  inStateToFind: PlaytestBaseState
) {
  const foundState = findStateInArray(inArray, inStateToFind);
  if (isUndefined(foundState)) {
    const newState = {
      branchName: inStateToFind.branchName,
      buildName: inStateToFind.buildName
    };
    inArray.push(newState);
    return newState;
  }
  return foundState;
}

export type PlaytestRemoteState = PlaytestBaseState & {
  branchName: string;
  buildName: string;
  bIsImportant: boolean;
  playtestTitle: string;
  playtestDesc: string;
};

export enum ELocalState {
  PendingState,
  Offline,
  Downloading,
  Ready
}

export type PlaytestLocalState = PlaytestBaseState & {
  state: ELocalState;
};

export type DPlaytestsProviderState = {
  bIsLoading: boolean;
};

export type DPlaytestsProvider = {
  playtests: Array<PlaytestRemoteState>;
  localState: Array<PlaytestLocalState>;
  providerState: DPlaytestsProviderState;
};

export type D1Action = Action<string> & {
  payload: object;
};
