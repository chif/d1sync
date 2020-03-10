// @flow
import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import PlaytestBuildComponent from './PlaytestBuildComponent';
import { D1RootState } from '../reducers/types';
import { D1Action, PlaytestRemoteState, DPlaytestsProviderState } from '../reducers/playtestTypes';
import {
  fetchPlaytestsRemoteStateFromFtp,
  fetchPlaytestsLocalBranches,
  updateRuntimeState
} from '../actions/playtestActions';

export default function PlaytestListComponent() {
  const playtests: Array<PlaytestRemoteState> = useSelector((state: D1RootState) => state.playtestsProvider.playtests);

  const providerState: DPlaytestsProviderState = useSelector(
    (state: D1RootState) => state.playtestsProvider.providerState
  );

  const { ftpConfig, localSettings } = useSelector((state: D1RootState) => state);

  const dispatch = useDispatch<D1Action>();

  useEffect(() => {
    if (!ftpConfig.bIsLoading) {
      dispatch(fetchPlaytestsRemoteStateFromFtp());
      dispatch(fetchPlaytestsLocalBranches());
      dispatch(updateRuntimeState());
    }
  }, [ftpConfig]);

  useEffect(() => {
    if (!ftpConfig.bIsLoading) {
      dispatch(fetchPlaytestsLocalBranches());
      dispatch(updateRuntimeState());
    }
  }, [localSettings]);

  useEffect(() => {
    const timerHandle = setInterval(() => {
      dispatch(updateRuntimeState());
    }, 500);

    return () => {
      clearInterval(timerHandle);
    };
  }, [localSettings]);

  const getBuildComponents = () => {
    if (providerState.bIsLoading) {
      return (
        <>
          <PlaytestBuildComponent
            bPlaceholder="true"
            branchName="placeholderBranch"
            buildName="placeholderBuild1"
            key={0}
          />
          <PlaytestBuildComponent
            bPlaceholder="true"
            branchName="placeholderBranch"
            buildName="placeholderBuild2"
            key={1}
          />
        </>
      );
    }

    return playtests
      .slice()
      .sort(
        (a: PlaytestRemoteState, b: PlaytestRemoteState) => -(parseInt(a.buildName, 10) - parseInt(b.buildName, 10))
      )
      .slice(0, 6)
      .map((playtestState: PlaytestRemoteState) => (
        <PlaytestBuildComponent
          key={providerState.buildName}
          bPlaceholder={providerState.bIsLoading}
          branchName={playtestState.branchName}
          buildName={playtestState.buildName}
        />
      ));
  };

  const getPlaytestComponents = () => {
    return <>{getBuildComponents()}</>;
  };

  return <Container>{getPlaytestComponents()}</Container>;
}
