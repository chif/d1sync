import * as storage from 'redux-storage';
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';
import { createPlaytestReducer, ftpConfig } from './playtestReducers';

export default function createRootReducer(history: History) {
  return storage.reducer(
    combineReducers({
      router: connectRouter(history),
      playtestsProvider: createPlaytestReducer(),
      ftpConfig
    })
  );
}
