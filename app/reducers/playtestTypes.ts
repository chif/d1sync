import { Dispatch as ReduxDispatch, Store as ReduxStore, Action } from 'redux';

export type PlaytestState = {
  branchName: string;
  buildName: string;
  bIsImportant: boolean;
  playtestTitle: string;
  playtestDesc: string;
};

export type DPlaytestsProvider = {
  playtests: Array<PlaytestState> = [];
};

export type D1Action = Action<string>;

export type GetState = () => D1SyncState;

export type Dispatch = ReduxDispatch<D1Action>;

export type Store = ReduxStore<D1SyncState, D1Action>;
