import { Action } from 'redux';

export type PlaytestState = {
  branchName: string;
  buildName: string;
  bIsImportant: boolean;
  playtestTitle: string;
  playtestDesc: string;
};

export type DPlaytestsProviderState = {
  bIsLoading: boolean;
};

export type DPlaytestsProvider = {
  playtests: Array<PlaytestState> = [];
  providerState: DPlaytestsProviderState;
};

export type D1Action = Action<string>;
