import { Action, combineReducers } from 'redux';
import electron from 'electron';
import { produce } from 'immer';
import { isNullOrUndefined } from 'util';
import {
  DPlaytestsProviderState,
  D1Action,
  PlaytestLocalState
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
  PLAYTEST_LOCAL_STATE_LOAD_START
} from './actionTypes';

export function localSettings(state: LocalSettings, action: D1Action) {
  switch (action.type) {
    case LOCAL_SETTINGS_UPDATE_LIBRARY_PATH:
      return produce(state, newState => {
        newState.libraryPath = action.payload;
      });
    default:
      if (!state || !state.libraryPath) {
        return produce(state || {}, newState => {
          newState.libraryPath = (electron.app || electron.remote.app).getPath(
            'userData'
          );
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

export function localState(
  state: Array<PlaytestLocalState> = [],
  action: D1Action
) {
  switch (action.type) {
    case PLAYTEST_LOCAL_STATE_SET_LIST_START:
      return [];
    case PLAYTEST_LOCAL_STATE_SET_LIST:
      return action.payload;
    case PLAYTEST_LOCAL_STATE_LOAD_START: {
      const payloadEntry: PlaytestLocalState = action.payload;

      return produce(state, (draftState: Array<PlaytestLocalState>) => {
        const foundEntry = draftState.find(
          element =>
            element.branchName === payloadEntry.branchName &&
            element.buildName === payloadEntry.buildName
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

export function playtests(state: Array<DPlaytestState> = [], action: D1Action) {
  switch (action.type) {
    case PLAYTEST_REMOTE_STATE_LOAD_START:
      return [];
    case PLAYTEST_REMOTE_STATE_SET_LIST:
      return action.payload;
    case PLAYTEST_TEST:
      return [...state, {}];
    default:
      return state;
  }
}

export function providerState(
  state: DPlaytestsProviderState,
  action: Action<string>
) {
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

export function createPlaytestReducer() {
  return combineReducers({
    playtests,
    localState,
    providerState
  });
}
