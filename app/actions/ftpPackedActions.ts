import { Dispatch } from 'react';
import { Client as FtpClient } from 'basic-ftp';
import { ProgressInfo } from 'basic-ftp/dist/ProgressTracker';
import fse from 'fs-extra';
import path from 'path';
import { Extract } from 'unzipper';
import { PlaytestBaseState, EDownloadState } from '../reducers/playtestTypes';
import { GetState } from '../reducers/types';
import { PLAYTEST_DOWNLOAD_STATE_SET } from '../reducers/actionTypes';

function reportError() {}

export function setDownloadState(state: PlaytestDownloadState) {
  return {
    type: PLAYTEST_DOWNLOAD_STATE_SET,
    payload: state
  };
}

export default function downloadPackedPlaytestBuild(build: PlaytestBaseState) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { branchName, buildName } = build;

    const { ftpConfig, localSettings } = getState();

    const accessOptions = {
      host: ftpConfig.url,
      user: ftpConfig.name,
      password: ftpConfig.pwd,
      secure: false
    };

    const ftpClient: FtpClient = new FtpClient();
    ftpClient.ftp.verbose = false;

    try {
      await ftpClient.access(accessOptions);

      dispatch(
        setDownloadState({
          state: EDownloadState.Downloading,
          branchName,
          buildName,
          totalBytes: 0,
          downloadedBytes: 0,
          avgSpeed: 0
        })
      );

      const fileRemotePath = `${ftpConfig.path}/${build.buildName}.zip`;

      const remoteSize = await ftpClient.size(fileRemotePath);

      dispatch(
        setDownloadState({
          state: EDownloadState.Downloading,
          branchName,
          buildName,
          totalBytes: remoteSize,
          downloadedBytes: 0,
          avgSpeed: 0
        })
      );

      ftpClient.trackProgress((info: ProgressInfo) => {
        dispatch(
          setDownloadState({
            state: EDownloadState.Downloading,
            branchName,
            buildName,
            totalBytes: remoteSize,
            downloadedBytes: info.bytesOverall
          })
        );
      });

      await fse.ensureDir(path.join(localSettings.libraryPath, build.branchName));

      await ftpClient.downloadTo(
        Extract({
          path: path.join(localSettings.libraryPath, build.branchName)
        }),
        fileRemotePath
      );

      dispatch(
        setDownloadState({
          state: EDownloadState.Success,
          branchName,
          buildName,
          totalBytes: 0,
          downloadedBytes: 0
        })
      );
    } catch (error) {
      reportError('failed to read ftp config', error.message);
      dispatch(
        setDownloadState({
          state: EDownloadState.Error,
          branchName,
          buildName,
          totalBytes: 0,
          downloadedBytes: 0
        })
      );
    }
    ftpClient.close();
  };
}
