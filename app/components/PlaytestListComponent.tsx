// @flow
import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import PlaytestBuildComponent from './PlaytestBuildComponent';
import { D1RootState } from '../reducers/types';
import {
  D1Action,
  PlaytestState,
  DPlaytestsProviderState
} from '../reducers/playtestTypes';
import { loadPlaytestsFromFtp } from '../actions/playtestActions';

export default function PlaytestListComponent() {
  const playtests: Array<PlaytestState> = useSelector(
    (state: D1RootState) => state.playtestsProvider.playtests
  );

  const providerState: DPlaytestsProviderState = useSelector(
    (state: D1RootState) => state.playtestsProvider.providerState
  );

  const ftpConfig = useSelector((state: D1RootState) => state.ftpConfig);

  const dispatch = useDispatch<D1Action>();

  useEffect(() => {
    if (!ftpConfig.bIsLoading) {
      dispatch(loadPlaytestsFromFtp());
    }
  }, [ftpConfig]);

  const getBuildComponents = () => {
    if (providerState.bIsLoading) {
      return (
        <>
          <PlaytestBuildComponent
            bPlaceholder="true"
            bIsImportant="true"
            branchName=".."
            buildName=".."
            playtestTitle=".."
            playtestDesc=".."
          />
          <PlaytestBuildComponent
            bPlaceholder="true"
            bIsImportant="true"
            branchName=".."
            buildName=".."
            playtestTitle=".."
            playtestDesc=".."
          />
        </>
      );
    }

    return playtests.map((playtestState: PlaytestState) => (
      <PlaytestBuildComponent
        key={providerState.buildName}
        bPlaceholder={providerState.bIsLoading}
        bIsImportant={playtestState.bIsImportant}
        branchName={playtestState.branchName}
        buildName={playtestState.buildName}
        playtestTitle={playtestState.playtestTitle}
        playtestDesc={playtestState.playtestDesc}
      />
    ));
  };

  const getPlaytestComponents = () => {
    return <>{getBuildComponents()}</>;
  };

  return <Container>{getPlaytestComponents()}</Container>;
}
