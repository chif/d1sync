import { Dispatch } from '../reducers/types';

export const PLAYTEST_TEST = 'PLAYTEST_TEST';
export const PLAYTEST_TEST_TWO = 'PLAYTEST_TEST_TWO';

export function test() {
  return {
    type: PLAYTEST_TEST
  };
}

export function testTwo() {
  return {
    type: PLAYTEST_TEST_TWO
  };
}

export function toggleListState(delay = 1000) {
  return (dispatch: Dispatch) => {
    setTimeout(() => {
      dispatch(testTwo());
    }, delay);
  };
}
