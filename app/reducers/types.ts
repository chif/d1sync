import { Dispatch as ReduxDispatch, Store as ReduxStore, Action } from 'redux';
import { DPlaytestsProvider } from './playtestTypes';

export type D1RootState = {
  playtestsProvider: DPlaytestsProvider;
};

export type GetState = () => D1RootState;

export type Dispatch = ReduxDispatch<Action<string>>;

export type Store = ReduxStore<counterStateType, Action<string>>;
