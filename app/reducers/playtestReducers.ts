import { Action, combineReducers } from 'redux';
import { DPlaytestsProviderState, D1Action } from './playtestTypes';
import { FtpConfig } from './types';
import {
  PLAYTEST_TEST,
  FTP_CONFIG_LOAD_START,
  FTP_CONFIG_LOAD_FINISH,
  PLAYTEST_SET_LIST,
  PLAYTEST_LOAD_START
} from './actionTypes';

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
