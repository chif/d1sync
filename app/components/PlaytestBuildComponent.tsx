import React, { useCallback, useEffect, useRef } from 'react';
import { Badge, Button, Card, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faGamepad, faServer, faCodeBranch, faTimes, faDownload } from '@fortawesome/free-solid-svg-icons';
import ContentLoader from 'react-content-loader';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from 'reselect';
import seedrandom from 'seedrandom';
import { DownloadProgressComponent } from './DownloadProgressComponent';
import { D1RootState } from '../reducers/types';
import {
  PlaytestBaseState,
  ELocalState,
  ESelectedState,
  EPlaytestRuntimeState,
  EDownloadState
} from '../reducers/playtestTypes';
import {
  fetchPlaytestRemoteEntryFromFtp,
  deleteLocalBuild,
  launchClient,
  stopClient,
  launchServer,
  stopServer,
  selectPathAndDownloadPlaytestBuild
} from '../actions/playtestActions';
import { selectMyRemoteEntry } from './StateSelectors';

type Props = {
  branchName: string;
  buildName: string;
  bPlaceholder: boolean;
};

const cardLoader = (linesCount = 1, seed = 'd1') => {
  const rng = seedrandom(seed);
  const children: Array<JSX.Element> = [];
  let height = 0;
  const wordsCount = Math.round(rng() * 6) + 1;
  let maxWidth = 32;

  for (let lineIndex = 0; lineIndex < linesCount; lineIndex++) {
    const rowHeight = 11;
    const padding = 6;
    let lineWidth = 0;
    const wordSpacing = 8;
    for (let wordIndex = 0; wordIndex < wordsCount; wordIndex++) {
      const wordWidth = Math.round(rng() * 80) + 16;
      children.push(
        <rect x={lineWidth} y={(rowHeight + padding) * lineIndex} rx="3" ry="3" width={wordWidth} height={rowHeight} />
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

const selectIsSelected = createSelector(
  (inEntry: PlaytestBaseState = {}) => inEntry,
  (rootState: D1RootState = {}) => rootState.playtestsProvider.selectedEntry,
  (inBaseEntry, inSelectedEntry) =>
    inSelectedEntry &&
    inSelectedEntry.branchName === inBaseEntry.branchName &&
    inSelectedEntry.buildName === inBaseEntry.buildName
);

const BuildComponent: React.FC<Props> = props => {
  const { branchName, buildName, bPlaceholder } = props;

  const { remoteState, localState, downloadState, runtimeState } = useSelector((state: D1RootState) =>
    selectMyRemoteEntry({ ...state, branchName, buildName })
  );

  const { state: selectedEntryState, args: selectedEntryArgs } = useSelector(
    (state: D1RootState) => state.playtestsProvider.selectedEntry
  );

  const bIsSelected = useSelector((state: D1RootState) => selectIsSelected({ ...state, branchName, buildName }));

  const { ftpConfig } = useSelector((state: D1RootState) => state);
  const seed = `${useSelector((state: D1RootState) => state.randomSeed)}${branchName}${buildName}`;

  const { bIsImportant, playtestDesc } = remoteState || {};
  const localStateValue = localState ? localState.state : ELocalState.Offline;

  const dispatch = useDispatch<D1Action>();

  const downloadCallback = useCallback(() => {
    dispatch(selectPathAndDownloadPlaytestBuild(remoteState));
  });

  const deleteCallback = useCallback(() => {
    dispatch(deleteLocalBuild(localState));
  });

  const startClientCallback = useCallback(() => {
    dispatch(launchClient(localState, bIsSelected ? selectedEntryArgs : []));
  });

  const startServerCallback = useCallback(() => {
    dispatch(launchServer(localState));
  });

  const stopClientCallback = useCallback(() => {
    dispatch(stopClient(localState));
  });

  const stopServerCallback = useCallback(() => {
    dispatch(stopServer(localState));
  });

  useEffect(() => {
    if (!ftpConfig.bIsLoading && remoteState && !remoteState.bExtenedInfoSet && !remoteState.bPendingUpdate) {
      dispatch(fetchPlaytestRemoteEntryFromFtp({ branchName, buildName }));
    }
  }, [ftpConfig, remoteState]);

  const myRef = useRef(null);
  const serverIconRef = useRef(null);

  useEffect(() => {
    const scrollToMe = async () => {
      let timeoutHandle = 0;
      if (
        !ftpConfig.bIsLoading &&
        remoteState &&
        remoteState.bExtenedInfoSet &&
        !remoteState.bPendingUpdate &&
        localStateValue !== ELocalState.PendingState &&
        downloadState.state !== EDownloadState.Downloading &&
        bIsSelected &&
        selectedEntryState !== ESelectedState.DownloadedOnce
      ) {
        timeoutHandle = setTimeout(() => {
          if (
            !ftpConfig.bIsLoading &&
            remoteState &&
            remoteState.bExtenedInfoSet &&
            !remoteState.bPendingUpdate &&
            bIsSelected &&
            selectedEntryState !== ESelectedState.DownloadedOnce
          ) {
            if (
              localStateValue === ELocalState.Offline &&
              downloadState.state !== EDownloadState.Downloading &&
              !(downloadState.downloadedBytes > 0) &&
              !(downloadState.totalBytes > 0)
            ) {
              // nop;
            }

            if (myRef && myRef.current) {
              window.scrollTo(0, myRef.current.offsetTop);
            }
          }
        }, 500);
      }
      return () => {
        clearTimeout(timeoutHandle);
      };
    };

    scrollToMe();
  }, [ftpConfig, remoteState, localState, bIsSelected]);

  const getBorder = () => {
    if (bPlaceholder) {
      return 'secondary';
    }

    if (localStateValue === ELocalState.Ready) {
      return 'primary';
    }
    if (downloadState.state === EDownloadState.Downloading) {
      return 'light';
    }

    if (bIsImportant) {
      return 'warning';
    }
    return 'secondary';
  };

  const getDownloadProgress = () => {
    return (
      <DownloadProgressComponent
        avgSpeed={downloadState.avgSpeed}
        downloadedBytes={downloadState.downloadedBytes}
        totalBytes={downloadState.totalBytes}
      />
    );
  };

  const getClientButton = () => {
    if (runtimeState.bClientState === EPlaytestRuntimeState.Running) {
      return (
        <Button className="mr-2" variant="outline-warning" onClick={stopClientCallback}>
          <FontAwesomeIcon className="mr-1" icon={faTimes} />
          {`Client${bIsSelected ? selectedEntryArgs.join(' ') : ''}`}
        </Button>
      );
    }
    return (
      <Button className="mr-2" variant="success" onClick={startClientCallback}>
        <FontAwesomeIcon className="mr-1" icon={faGamepad} />
        Client
      </Button>
    );
  };

  const getServerButton = () => {
    if (runtimeState.bServerState === EPlaytestRuntimeState.Running) {
      return (
        <>
          <Button className="mr-2" variant="outline-warning" ref={serverIconRef} onClick={stopServerCallback}>
            <FontAwesomeIcon className="mr-1" icon={faTimes} />
            Server
          </Button>
        </>
      );
    }
    return (
      <Button className="mr-2" variant="secondary" onClick={startServerCallback}>
        <FontAwesomeIcon className="mr-1" icon={faServer} />
        Server
      </Button>
    );
  };

  const getDeleteButton = () => {
    if (
      runtimeState.bClientState === EPlaytestRuntimeState.Running ||
      runtimeState.bServerState === EPlaytestRuntimeState.Running
    ) {
      return (
        <Button variant="outline-secondary" onClick={deleteCallback} disabled>
          <FontAwesomeIcon icon={faTrash} />
        </Button>
      );
    }
    return (
      <Button variant="secondary" onClick={deleteCallback}>
        <FontAwesomeIcon icon={faTrash} />
      </Button>
    );
  };

  const getButtons = () => {
    if (bPlaceholder) {
      return <></>;
    }

    if (downloadState.state === EDownloadState.Downloading) {
      return getDownloadProgress();
    }

    switch (localStateValue) {
      case ELocalState.Offline:
        return (
          <Button className="mr-2" variant="primary" onClick={downloadCallback}>
            <FontAwesomeIcon className="mr-1" icon={faDownload} />
            Download
          </Button>
        );
      case ELocalState.Ready:
        return (
          <div>
            {getClientButton()}
            {getServerButton()}
            {getDeleteButton()}
          </div>
        );
      case ELocalState.PendingState:
      default:
        return <></>;
    }
  };

  const getHeader = () => {
    if (bPlaceholder) {
      return <span>{cardLoader(1, `${seed}header`)}</span>;
    }
    const branchNameVariant = bIsSelected ? 'warning' : 'primary';
    return (
      <h4>
        <Badge variant={branchNameVariant} className="shadow">
          {buildName}
        </Badge>
        <small className="m-1">
          <Badge pill variant="secondary" className="shadow">
            <FontAwesomeIcon className="mr-1" icon={faCodeBranch} />
            {branchName}
          </Badge>
        </small>
      </h4>
    );
  };

  const getDesc = () => {
    if (remoteState.bPendingUpdate) {
      return <Spinner animation="border" role="status" />;
    }
    return playtestDesc;
  };

  const getContent = () => {
    if (bPlaceholder) {
      return (
        <>
          <Card.Title>{cardLoader(1, `${seed}title`)}</Card.Title>
          <Card.Text>{cardLoader(4, `${seed}text`)}</Card.Text>
        </>
      );
    }

    if (remoteState.bPendingUpdate) {
      return <Spinner animation="border" role="status" />;
    }

    return (
      <>
        <Card.Text>{getDesc()}</Card.Text>
        {getButtons()}
      </>
    );
  };

  const getHeaderClass = () => {
    if (localStateValue === ELocalState.Deleting) {
      return 'm-1 shadow bg-danger';
    }
    if (bIsSelected) {
      return `m-1 shadow bg-info`;
    }
    return `m-1 shadow bg-secondary`;
  };

  return (
    <Card border={getBorder()} className="m-2 shadow-lg" ref={myRef}>
      <Card.Header className={getHeaderClass()}>{getHeader()}</Card.Header>
      <Card.Body>{getContent()}</Card.Body>
    </Card>
  );
};

export default BuildComponent;
