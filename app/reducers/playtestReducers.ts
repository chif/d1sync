import { Action } from 'redux';
import { DPlaytestsProvider } from './playtestTypes';
import { PLAYTEST_TEST, PLAYTEST_TEST_TWO } from '../actions/playtestActions';

export default function playtestsProvider(
  state: DPlaytestsProvider = {
    playtests: []
  },
  action: Action<string>
) {
  switch (action.type) {
    case PLAYTEST_TEST:
      return state.playtests.push({});
    case PLAYTEST_TEST_TWO:
      return state.playtests.push({});
    default:
      return state;
  }
}
