import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';
import playtestsProvider from './playtestReducers';

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    playtestsProvider
  });
}
