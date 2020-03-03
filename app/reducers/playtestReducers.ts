import { Action, combineReducers } from 'redux';
import electron from 'electron';
import { produce } from 'immer';
import { DPlaytestsProviderState, D1Action } from './playtestTypes';
import { FtpConfig, LocalSettings } from './types';
import {
  PLAYTEST_TEST,
  FTP_CONFIG_LOAD_START,
  FTP_CONFIG_LOAD_FINISH,
  PLAYTEST_SET_LIST,
  PLAYTEST_LOAD_START,
  LOCAL_SETTINGS_UPDATE_LIBRARY_PATH
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

export function playtests(state: Array<DPlaytestState> = [], action: D1Action) {
  switch (action.type) {
    case PLAYTEST_LOAD_START:
      return [];
    case PLAYTEST_SET_LIST:
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
    case PLAYTEST_LOAD_START:
    case FTP_CONFIG_LOAD_START:
      return {
        bIsLoading: true
      };
    case FTP_CONFIG_LOAD_FINISH:
    case PLAYTEST_SET_LIST:
    default:
      return {
        bIsLoading: false
      };
  }
}

export function createPlaytestReducer() {
  return combineReducers({
    playtests,
    providerState
  });
}
