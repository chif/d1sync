import { createStore, applyMiddleware } from 'redux';
import createEngine from 'redux-storage-engine-electron-store';
import * as storage from 'redux-storage';
import thunk from 'redux-thunk';
import { createHashHistory } from 'history';
import { routerMiddleware } from 'connected-react-router';
import createRootReducer from '../reducers';
import { Store, D1RootState } from '../reducers/types';

const history = createHashHistory();
const rootReducer = createRootReducer(history);
const router = routerMiddleware(history);
const reduxStorageEngine = createEngine();
const reduxStorage = storage.createMiddleware(reduxStorageEngine);
const enhancer = applyMiddleware(thunk, router, reduxStorage);

function configureStore(initialState?: D1RootState): Store {
  return createStore(rootReducer, initialState, enhancer);
}

export default {
  configureStore,
  history,
  reduxStorageEngine
};
