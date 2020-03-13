import { createSelector } from 'reselect';
import {
  PlaytestBaseState,
  EDownloadState,
  EPlaytestRuntimeState,
  PlaytestDownloadState
} from '../reducers/playtestTypes';
import { D1RootState } from '../reducers/types';

/* eslint import/prefer-default-export: off */
export const selectMyRemoteEntry = createSelector(
  (inEntry: PlaytestBaseState = {}) => inEntry,
  (rootState: D1RootState = {}) => rootState.playtestsProvider.playtests,
  (rootState: D1RootState = {}) => rootState.playtestsProvider.localState,
  (rootState: D1RootState = {}) => rootState.playtestsProvider.downloadState,
  (rootState: D1RootState = {}) => rootState.playtestsProvider.runtimeState,
  (baseEntry, remoteStates, localStates, downloadStates, runtimeStates) => ({
    remoteState: remoteStates.find(
      remoteEntry => remoteEntry.buildName === baseEntry.buildName && remoteEntry.branchName === baseEntry.branchName
    ),
    localState: localStates.find(
      localEntry => localEntry.branchName === baseEntry.branchName && localEntry.buildName === baseEntry.buildName
    ),
    downloadState:
      downloadStates.find(
        downloadEntry =>
          downloadEntry.branchName === baseEntry.branchName && downloadEntry.buildName === baseEntry.buildName
      ) || ({ downloadedBytes: 0, totalBytes: 0, state: EDownloadState.Idle } as PlaytestDownloadState),
    runtimeState:
      runtimeStates.find(
        runtimeEntry =>
          runtimeEntry.branchName === baseEntry.branchName && runtimeEntry.buildName === baseEntry.buildName
      ) ||
      ({ bClientState: EPlaytestRuntimeState.Idle, bServerState: EPlaytestRuntimeState.Idle } as PlaytestRuntimeState)
  })
);
