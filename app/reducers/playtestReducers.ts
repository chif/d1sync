import { Action, combineReducers } from 'redux';
import electron from 'electron';
import path from 'path';
import { produce } from 'immer';
import { isNullOrUndefined } from 'util';
import {
  DPlaytestsProviderState,
  D1Action,
  PlaytestLocalState,
  PlaytestRemoteState,
  PlaytestBaseState,
  PlaytestDownloadState,
  PlaytestSelectedState,
  ELocalState,
  ESelectedState,
  PlaytestRuntimeState
} from './playtestTypes';
import { FtpConfig, LocalSettings } from './types';
import {
  PLAYTEST_TEST,
  FTP_CONFIG_LOAD_START,
  FTP_CONFIG_LOAD_FINISH,
  PLAYTEST_REMOTE_STATE_SET_LIST,
  PLAYTEST_REMOTE_STATE_LOAD_START,
  LOCAL_SETTINGS_UPDATE_LIBRARY_PATH,
  PLAYTEST_LOCAL_STATE_SET_LIST_START,
  PLAYTEST_LOCAL_STATE_SET_LIST,
  PLAYTEST_LOCAL_STATE_LOAD_START,
  PLAYTEST_REMOTE_ENTRY_LOAD,
  PLAYTEST_REMOTE_ENTRY_SET,
  RANDOM_SEED_SET,
  PLAYTEST_DOWNLOAD_STATE_SET,
  PLAYTEST_SELECTED_ENTRY_SET,
  PLAYTEST_RUNTIME_STATE_SET
} from './actionTypes';

export function setRandomSeed(state: number, action: D1Action) {
  switch (action.type) {
    case RANDOM_SEED_SET:
      return action.payload;
    default:
      return 'dummy';
  }
}

export function localSettings(state: LocalSettings, action: D1Action) {
  switch (action.type) {
    case LOCAL_SETTINGS_UPDATE_LIBRARY_PATH:
      return produce(state, newState => {
        newState.libraryPath = action.payload;
        newState.bPathWasSetByUser = true;
      });
    default:
      if (!state || !state.libraryPath) {
        return produce(state || {}, newState => {
          newState.libraryPath = path.join((electron.app || electron.remote.app).getPath('userData'), 'playtests');
          newState.bPathWasSetByUser = false;
        });
      }
      return state;
  }
}

export function ftpConfig(state: FtpConfig = {}, action: D1Action) {
  switch (action.type) {
    case FTP_CONFIG_LOAD_START:
      return {
        bIsLoading: true
      };
    case FTP_CONFIG_LOAD_FINISH:
      return action.payload;
    default:
      return state;
  }
}

export function localState(state: Array<PlaytestLocalState> = [], action: D1Action) {
  switch (action.type) {
    case FTP_CONFIG_LOAD_START:
    case FTP_CONFIG_LOAD_FINISH:
    case PLAYTEST_LOCAL_STATE_SET_LIST_START:
      return [];
    case PLAYTEST_LOCAL_STATE_SET_LIST:
      return action.payload;
    case PLAYTEST_LOCAL_STATE_LOAD_START: {
      const payloadEntry: PlaytestLocalState = action.payload;

      return produce(state, (draftState: Array<PlaytestLocalState>) => {
        const foundEntry = draftState.find(
          element => element.branchName === payloadEntry.branchName && element.buildName === payloadEntry.buildName
        );

        if (isNullOrUndefined(foundEntry)) {
          const newEntry: PlaytestLocalState = {
            branchName: payloadEntry.branchName,
            buildName: payloadEntry.buildName,
            state: payloadEntry.state
          };
          draftState.push(newEntry);
        } else {
          foundEntry.state = payloadEntry.state;
        }
      });
    }
    default:
      return state;
  }
}

export function playtests(state: Array<PlaytestRemoteState> = [], action: D1Action) {
  switch (action.type) {
    case FTP_CONFIG_LOAD_START:
    case FTP_CONFIG_LOAD_FINISH:
    case PLAYTEST_REMOTE_STATE_LOAD_START:
      return [];
    case PLAYTEST_REMOTE_STATE_SET_LIST:
      return action.payload;
    case PLAYTEST_TEST:
      return [...state, {}];
    case PLAYTEST_REMOTE_ENTRY_LOAD: {
      const payloadEntry: PlaytestBaseState = action.payload;

      return produce(state, (draftState: Array<PlaytestRemoteState>) => {
        const foundEntry = draftState.find(
          element => element.branchName === payloadEntry.branchName && element.buildName === payloadEntry.buildName
        );

        if (isNullOrUndefined(foundEntry)) {
          const newEntry: PlaytestRemoteState = {
            branchName: payloadEntry.branchName,
            buildName: payloadEntry.buildName,
            bPendingUpdate: true,
            bExtenedInfoSet: false
          };
          draftState.push(newEntry);
        } else {
          foundEntry.bPendingUpdate = true;
          foundEntry.bExtenedInfoSet = false;
        }
      });
    }

    case PLAYTEST_REMOTE_ENTRY_SET: {
      const payloadEntry: PlaytestRemoteState = action.payload;

      return produce(state, (draftState: Array<PlaytestRemoteState>) => {
        const foundEntry = draftState.find(
          element => element.branchName === payloadEntry.branchName && element.buildName === payloadEntry.buildName
        );

        if (isNullOrUndefined(foundEntry)) {
          const newEntry: PlaytestRemoteState = { ...payloadEntry, bPendingUpdate: false, bExtenedInfoSet: true };
          draftState.push(newEntry);
        } else {
          Object.assign(foundEntry, payloadEntry);
          foundEntry.bPendingUpdate = false;
          foundEntry.bExtenedInfoSet = true;
        }
      });
    }

    default:
      return state;
  }
}

export function downloadState(state: Array<PlaytestDownloadState>, action: D1Action) {
  switch (action.type) {
    case PLAYTEST_REMOTE_STATE_SET_LIST:
      return [];
    case PLAYTEST_DOWNLOAD_STATE_SET:
      return produce(state, (draftState: Array<PlaytestDownloadState>) => {
        const payloadEntry: PlaytestDownloadState = action.payload;
        payloadEntry.lastReportAt = Date.now();
        const foundEntry: PlaytestDownloadState = draftState.find(
          element => element.branchName === payloadEntry.branchName && element.buildName === payloadEntry.buildName
        );

        if (isNullOrUndefined(foundEntry)) {
          const newEntry: PlaytestDownloadState = { ...payloadEntry };
          newEntry.avgSpeed = 0;
          draftState.push(newEntry);
        } else {
          const deltaBytes = payloadEntry.downloadedBytes - foundEntry.downloadedBytes;
          const deltaTime = payloadEntry.lastReportAt - foundEntry.lastReportAt || 0;
          if (deltaBytes > 0 && deltaTime > 0) {
            const avgK = 0.1;
            payloadEntry.avgSpeed = foundEntry.avgSpeed * (1 - avgK) + (deltaBytes / (deltaTime / 1000)) * avgK;
          } else {
            payloadEntry.avgSpeed = foundEntry.avgSpeed;
          }

          Object.assign(foundEntry, payloadEntry);
        }
      });
    default:
      return state || [];
  }
}

export function providerState(state: DPlaytestsProviderState, action: Action<string>) {
  switch (action.type) {
    case PLAYTEST_REMOTE_STATE_LOAD_START:
    case FTP_CONFIG_LOAD_START:
      return {
        bIsLoading: true
      };
    case FTP_CONFIG_LOAD_FINISH:
    case PLAYTEST_REMOTE_STATE_SET_LIST:
      return {
        bIsLoading: false
      };
    default:
      return state || { bIsLoading: true };
  }
}

export function selectedEntry(state: PlaytestSelectedState, action: D1Action) {
  switch (action.type) {
    case PLAYTEST_LOCAL_STATE_LOAD_START: {
      const payloadEntry: PlaytestLocalState = action.payload;
      if (
        payloadEntry.state === ELocalState.Ready &&
        payloadEntry.branchName === state.branchName &&
        payloadEntry.buildName === state.buildName
      ) {
        return produce(state, draft => {
          draft.state = ESelectedState.DownloadedOnce;
        });
      }
      return state || {};
    }
    case PLAYTEST_SELECTED_ENTRY_SET:
      return action.payload;
    /* case PLAYTEST_REMOTE_STATE_SET_LIST: {
      const newList: Array<PlaytestRemoteState> = action.payload;
      if (newList && newList.length > 0) {
        const lastEntry: PlaytestRemoteState = newList[newList.length - 1];
        const newSelectedEntry: PlaytestBaseState = {
          branchName: lastEntry.branchName,
          buildName: lastEntry.buildName
        };
        return newSelectedEntry;
      }

      return state || {};
    } */
    default:
      return state || {};
  }
}

export function runtimeState(state: Array<PlaytestRuntimeState> = [], action: D1Action) {
  switch (action.type) {
    case FTP_CONFIG_LOAD_START:
    case FTP_CONFIG_LOAD_FINISH:
      return [];
    case PLAYTEST_RUNTIME_STATE_SET:
      return action.payload;
    default:
      return state || [];
  }
}

export function createPlaytestReducer() {
  return combineReducers({
    playtests,
    localState,
    providerState,
    downloadState,
    selectedEntry,
    runtimeState
  });
}
