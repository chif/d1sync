// @flow
import React from 'react';
import { ListGroup } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import PlaytestBuildComponent from './PlaytestBuildComponent';
import { D1RootState } from '../reducers/types';
import { DPlaytestsProvider, D1Action } from '../reducers/playtestTypes';
import { PLAYTEST_TEST } from '../actions/playtestActions';

export default function PlaytestListComponent() {
  const playtestProvider: DPlaytestsProvider = useSelector(
    (state: D1RootState) => state.playtestsProvider
  );

  const dispatch = useDispatch<D1Action>();

  setTimeout(() => {
    dispatch({ type: PLAYTEST_TEST });
  }, 5000);

  const { length } = playtestProvider.playtests;
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
