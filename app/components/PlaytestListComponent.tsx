// @flow
import React, { useEffect } from 'react';
import { ListGroup, Spinner } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import PlaytestBuildComponent from './PlaytestBuildComponent';
import { D1RootState } from '../reducers/types';
import {
  D1Action,
  PlaytestState,
  DPlaytestsProviderState
} from '../reducers/playtestTypes';
import { PLAYTEST_TEST, toggleListState } from '../actions/playtestActions';

export default function PlaytestListComponent() {
  const playtests: Array<PlaytestState> = useSelector(
    (state: D1RootState) => state.playtestsProvider.playtests
  );

  const providerState: DPlaytestsProviderState = useSelector(
    (state: D1RootState) => state.playtestsProvider.providerState
  );

  const dispatch = useDispatch<D1Action>();

  useEffect(() => {
    dispatch(toggleListState(1500));

    const timerHandle = setTimeout(() => {
      dispatch({ type: PLAYTEST_TEST });
    }, 2000);
    return () => {
      clearTimeout(timerHandle);
    };
  }, [playtests]);

  const { length } = playtests;

  if (providerState.bIsLoading) {
    return <Spinner animation="border" />;
  }

  return (
    <ListGroup>
      <ListGroup.Item>
        <PlaytestBuildComponent
          bIsImportant="true"
          branchName="Master"
          buildName={length}
          playtestTitle="Тир"
          playtestDesc="Открыть консоль
StartMission ShootingRange
Добавлено новое оружие и улучшено старое"
        />
        <PlaytestBuildComponent
          branchName="Master"
          buildName="6830"
          playtestTitle="Пятничный плейтест"
        />
        <PlaytestBuildComponent
          branchName="Gunplay"
          buildName="6848"
          playtestTitle="Мне лень заполнять title"
          playtestDesc="There are no issues in this epic."
        />
        <PlaytestBuildComponent
          branchName="Master"
          buildName="6820"
          playtestTitle="Test-test"
          playtestDesc="Long version:

Currently you shouldn't want to work with nested state in React. Because React is not oriented to work with nested states and all solutions proposed here look as hacks. They don't use the framework but fight with it. They suggest to write not so clear code for doubtful purpose of grouping some properties. So they are very interesting as an answer to the challenge but practically useless."
        />
      </ListGroup.Item>
    </ListGroup>
  );
}
