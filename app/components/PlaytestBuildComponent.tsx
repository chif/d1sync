// @flow
import React, { useCallback } from 'react';
import { Badge, Button, Card, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import ContentLoader from 'react-content-loader';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from 'reselect';
import { D1RootState } from '../reducers/types';
import { PlaytestBaseState, ELocalState } from '../reducers/playtestTypes';
import { downloadPlaytestBuild } from '../actions/playtestActions';

type Props = {
  branchName: string;
  buildName: string;
  bPlaceholder: boolean;
};

const cardLoader = (linesCount = 1) => {
  const children: Array<JSX.Element> = [];
  let height = 0;
  const wordsCount = Math.round(Math.random() * 6) + 1;
  let maxWidth = 32;

  for (let lineIndex = 0; lineIndex < linesCount; lineIndex++) {
    const rowHeight = 11;
    const padding = 6;
    let lineWidth = 0;
    const wordSpacing = 8;
    for (let wordIndex = 0; wordIndex < wordsCount; wordIndex++) {
      const wordWidth = Math.round(Math.random() * 80) + 16;
      children.push(
        <rect
          x={lineWidth}
          y={(rowHeight + padding) * lineIndex}
          rx="3"
          ry="3"
          width={wordWidth}
          height={rowHeight}
        />
      );
      lineWidth += wordWidth + wordSpacing;
    }

    maxWidth = Math.max(lineWidth, maxWidth);
    height += rowHeight + padding;
  }

  const viewBox = `0 0 ${maxWidth} ${height}`;
  return (
    <ContentLoader
      key={height}
      speed={1}
      width={maxWidth}
      height={height}
      viewBox={viewBox}
      backgroundColor="#a0a0a0"
      foregroundColor="#fafafa"
    >
      {children}
    </ContentLoader>
  );
};

const selectMyRemoteEntry = createSelector(
  (inEntry: PlaytestBaseState = {}) => inEntry,
  (rootState: D1RootState = {}) => rootState.playtestsProvider.playtests,
  (rootState: D1RootState = {}) => rootState.playtestsProvider.localState,
  (baseEntry, remoteStates, localStates) => ({
    remoteState: remoteStates.find(
      remoteEntry =>
        remoteEntry.buildName === baseEntry.buildName &&
        remoteEntry.branchName === baseEntry.branchName
    ),
    localState: localStates.find(
      localEntry =>
        localEntry.branchName === baseEntry.branchName &&
        localEntry.buildName === baseEntry.buildName
    )
  })
);

const BuildComponent: React.FC<Props> = props => {
  const { branchName, buildName, bPlaceholder } = props;

  const { remoteState, localState } = useSelector((state: D1RootState) =>
    selectMyRemoteEntry({ ...state, branchName, buildName })
  );

  const { bIsImportant, playtestTitle, playtestDesc } = remoteState || {};
  const localStateValue = localState ? localState.state : ELocalState.Offline;

  const dispatch = useDispatch<D1Action>();

  const downloadCallback = useCallback(() => {
    dispatch(downloadPlaytestBuild(remoteState));
  });

  const border: string =
    !bPlaceholder && bIsImportant ? 'warning' : 'secondary';
  const branchBadge: string =
    branchName.toLocaleLowerCase() === 'master' ? 'info' : 'light';

  const getBadges = () => {
    if (!bPlaceholder && bIsImportant) {
      return (
        <Badge pill variant="warning">
          !
        </Badge>
      );
    }

    return <span />;
  };

  const getButtons = () => {
    if (bPlaceholder) {
      return <></>;
    }

    switch (localStateValue) {
      case ELocalState.Offline:
        return (
          <Button className="mr-3" variant="primary" onClick={downloadCallback}>
            Download
          </Button>
        );
      case ELocalState.Ready:
        return (
          <div>
            <Button className="mr-3" variant="success">
              Start
            </Button>
            <Button variant="secondary">
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </div>
        );
      case ELocalState.Downloading:
        return <ProgressBar animated now={100} />;
      case ELocalState.PendingState:
      default:
        return <></>;
    }
  };

  const getHeader = () => {
    if (bPlaceholder) {
      return cardLoader(1);
    }
    return (
      <>
        <Badge variant={branchBadge}>{branchName}</Badge>
        <span className="m-1">{buildName}</span>
        {getBadges()}
      </>
    );
  };

  const getContent = () => {
    if (bPlaceholder) {
      return (
        <>
          <Card.Title>{cardLoader(1)}</Card.Title>
          <Card.Text>{cardLoader(4)}</Card.Text>
        </>
      );
    }

    return (
      <>
        <Card.Title>{playtestTitle}</Card.Title>
        <Card.Text>{playtestDesc}</Card.Text>
        {getButtons()}
      </>
    );
  };

  return (
    <Card border={border} className="m-2">
      <Card.Header>
        <h5>{getHeader()}</h5>
      </Card.Header>
      <Card.Body>{getContent()}</Card.Body>
    </Card>
  );
};

export default BuildComponent;
