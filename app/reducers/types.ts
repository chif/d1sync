import { Dispatch as ReduxDispatch, Store as ReduxStore, Action } from 'redux';
import { DPlaytestsProvider } from './playtestTypes';

export type LocalSettings = {
  libraryPath: string;
};

export type FtpConfig = {
  url: string;
  path: string;
  name: string;
  pwd: string;
  bIsLoading: boolean;
};

export type D1RootState = {
  playtestsProvider: DPlaytestsProvider;
  ftpConfig: FtpConfig;
  localSettings: LocalSettings;
  randomSeed: number;
};

export type GetState = () => D1RootState;

export type Dispatch = ReduxDispatch<Action<string>>;

export type Store = ReduxStore<D1RootState, Action<string>>;
