import React from 'react';
import { Badge, ProgressBar } from 'react-bootstrap';
import filesize from 'filesize';
import { Spring } from 'react-spring';
import { PlaytestDownloadState } from '../reducers/playtestTypes';

type DownloadProps = PlaytestDownloadState;

/* eslint import/prefer-default-export: off */
export const DownloadProgressComponent: React.FC<DownloadProps> = downloadProps => {
  const { totalBytes, downloadedBytes, avgSpeed } = downloadProps;

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

  return (
    <div>
      <Spring to={{ nowValue: ((downloadedBytes + avgSpeed * 1.0) / totalBytes) * 100 }} config={{ mass: 1 }}>
        {props => <ProgressBar now={props.nowValue.getValue()} />}
      </Spring>
      <Badge variant="secondary">{filesize(totalBytes)}</Badge>
      <Badge variant="warning">
        {filesize(avgSpeed)}
        /s
      </Badge>
      <Spring to={{ timeLeft: (totalBytes - downloadedBytes) / avgSpeed }}>
        {props => <Badge className="float-right">{`${Math.round(props.timeLeft.getValue())}s`}</Badge>}
      </Spring>
    </div>
  );
};
