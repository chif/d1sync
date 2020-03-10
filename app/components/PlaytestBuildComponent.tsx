// @flow
import React, { useCallback, useEffect, useRef } from 'react';
import { Badge, Button, Card, ProgressBar, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrash,
  faCloudDownloadAlt,
  faGamepad,
  faServer,
  faCodeBranch,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import ContentLoader from 'react-content-loader';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from 'reselect';
import filesize from 'filesize';
import seedrandom from 'seedrandom';
import { D1RootState } from '../reducers/types';
import {
  PlaytestBaseState,
  ELocalState,
  ESelectedState,
  PlaytestRuntimeState,
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

const selectMyRemoteEntry = createSelector(
  (inEntry: PlaytestBaseState = {}) => inEntry,
  (rootState: D1RootState = {}) => rootState.playtestsProvider.playtests,
  (rootState: D1RootState = {}) => rootState.playtestsProvider.localState,
  (rootState: D1RootState = {}) => rootState.playtestsProvider.downloadState,
  (rootState: D1RootState = {}) => rootState.playtestsProvider.runtimeState,
  (baseEntry, remoteStates, localStates, downloadStates, runtimeStates) => ({
    remoteState: remoteStates.find(
      remoteEntry => remoteEntry.buildName === baseEntry.buildName && remoteEntry.branchName === baseEntry.branchName
    ),
    localState: localStates.find(
      localEntry => localEntry.branchName === baseEntry.branchName && localEntry.buildName === baseEntry.buildName
    ),
    downloadState: downloadStates.find(
      downloadEntry =>
        downloadEntry.branchName === baseEntry.branchName && downloadEntry.buildName === baseEntry.buildName
    ) || { downloadedBytes: 0, totalBytes: 0, state: EDownloadState.Idle },
    runtimeState:
      runtimeStates.find(
        runtimeEntry =>
          runtimeEntry.branchName === baseEntry.branchName && runtimeEntry.buildName === baseEntry.buildName
      ) ||
      ({ bClientState: EPlaytestRuntimeState.Idle, bServerState: EPlaytestRuntimeState.Idle } as PlaytestRuntimeState)
  })
);

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

  const { state: selectedEntryState } = useSelector((state: D1RootState) => state.playtestsProvider.selectedEntry);

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
    dispatch(launchClient(localState));
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
  const tooltipTargetRef = useRef(null);
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
              downloadCallback();
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
    const { totalBytes, downloadedBytes, avgSpeed } = downloadState;
    if (totalBytes === 0 && downloadedBytes === 0) {
      return (
        <div>
          <ProgressBar animated now={100} />
        </div>
      );
    }

    if (totalBytes === 0 || downloadedBytes === 0 || downloadedBytes >= totalBytes) {
      return (
        <div>
          <ProgressBar animated now={100} />
          <Badge variant="warning">{filesize(totalBytes)}</Badge>
        </div>
      );
    }

    const formatMbit = bytes => `${((bytes / 8) * 1e-6).toFixed(1)} Mbs`;

    const donwloadProgress = (downloadedBytes / totalBytes) * 100;
    return (
      <div>
        <ProgressBar now={donwloadProgress} ref={tooltipTargetRef} />
        <Badge variant="secondary">{filesize(totalBytes)}</Badge>
        <Badge variant="warning">{formatMbit(avgSpeed)}</Badge>
      </div>
    );
  };

  const getClientButton = () => {
    if (runtimeState.bClientState === EPlaytestRuntimeState.Running) {
      return (
        <Button className="mr-2" variant="outline-warning" onClick={stopClientCallback}>
          <FontAwesomeIcon className="mr-1" icon={faTimes} />
          Client
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
            <FontAwesomeIcon className="mr-1" icon={faCloudDownloadAlt} />
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
