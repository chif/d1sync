import { Action, combineReducers } from 'redux';
import { DPlaytestsProviderState } from './playtestTypes';
import { PLAYTEST_TEST, PLAYTEST_TEST_TWO } from '../actions/playtestActions';

export function playtests(
  state: Array<DPlaytestState> = [],
  action: Action<string>
) {
  switch (action.type) {
    case PLAYTEST_TEST:
      return [...state, {}];
    default:
      return state;
  }
}

export function providerState(
  state: DPlaytestsProviderState = {},
  action: Action<string>
) {
  switch (action.type) {
    case PLAYTEST_TEST_TWO:
      return {
        bIsLoading: !state.bIsLoading
      };
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
