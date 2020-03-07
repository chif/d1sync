import electron from 'electron';
import fs, { Dirent } from 'fs';
import path from 'path';
import { Client as FtpClient, FileInfo } from 'basic-ftp';
import { ProgressInfo } from 'basic-ftp/dist/ProgressTracker';
import sleep from 'await-sleep';
import { Dispatch, GetState } from '../reducers/types';
import {
  PLAYTEST_TEST,
  PLAYTEST_TEST_TWO,
  FTP_CONFIG_LOAD_FINISH,
  FTP_CONFIG_LOAD_START,
  PLAYTEST_REMOTE_STATE_SET_LIST,
  PLAYTEST_REMOTE_STATE_LOAD_START,
  LOCAL_SETTINGS_UPDATE_LIBRARY_PATH,
  PLAYTEST_LOCAL_STATE_LOAD_START,
  PLAYTEST_LOCAL_STATE_SET_LIST_START,
  PLAYTEST_REMOTE_ENTRY_LOAD,
  PLAYTEST_REMOTE_ENTRY_SET,
  RANDOM_SEED_SET,
  PLAYTEST_DOWNLOAD_STATE_SET,
  PLAYTEST_SELECTED_ENTRY_SET
} from '../reducers/actionTypes';
import { ELocalState, PlaytestBaseState, PlaytestRemoteState, PlaytestDownloadState } from '../reducers/playtestTypes';

const DO_NOT_GC_ME_PLEASE = [];
let staticFtpInstances = 0;

export function reportError() {}

export function setRandomSeed(inSeed: number) {
  return {
    type: RANDOM_SEED_SET,
    payload: inSeed
  };
}

export function setSelectedEntry(entry: PlaytestBaseState) {
  return {
    type: PLAYTEST_SELECTED_ENTRY_SET,
    payload: entry
  };
}

export function setDownloadState(state: PlaytestDownloadState) {
  return {
    type: PLAYTEST_DOWNLOAD_STATE_SET,
    payload: state
  };
}

export function selectLibraryPath() {
  return async (dispatch: Dispatch) => {
    const dialog = electron.dialog || electron.remote.dialog;
    const dir = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (!dir.canceled) {
      dispatch({
        type: LOCAL_SETTINGS_UPDATE_LIBRARY_PATH,
        payload: dir.filePaths[0]
      });
    }
  };
}

export function loadFtpConfig() {
  return async (dispatch: Dispatch) => {
    dispatch({ type: FTP_CONFIG_LOAD_START });
    const configPath = '\\\\m1fsg5.mail.msk\\Games2$\\AT\\F1\\D1\\playtester.json';

    try {
      const data = await fs.promises.readFile(configPath, {
        encoding: 'utf8',
        flag: 'r'
      });

      const parsedConfig = JSON.parse(data);
      dispatch({ type: FTP_CONFIG_LOAD_FINISH, payload: parsedConfig });
    } catch (error) {
      reportError('failed to read ftp config', error.message);
    }
  };
}

export function downloadPlaytestBuild(build: PlaytestBaseState) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const fetchTrueRemoteSize = async (ftpClient: FtpClient) => {
      const { ftpConfig } = getState();
      const { buildName, branchName } = build;

      const directories: Array<string> = [];
      const fetchDirSize = async (remotePath: string) => {
        const list = await ftpClient.list(remotePath);
        let totalSize = 0;
        list.forEach(entry => {
          if (entry.isDirectory) {
            directories.push(`${remotePath}/${entry.name}`);
          } else {
            totalSize += entry.size;
          }

          return entry;
        });

        return totalSize;
      };

      let totalSize = 0;
      let dispatchThreshold = 0;
      directories.push(`${ftpConfig.path}/${buildName}`);

      while (directories.length > 0) {
        totalSize += await fetchDirSize(directories.pop());
        if (totalSize > dispatchThreshold) {
          dispatchThreshold = totalSize + 1024 * 1024 * 100;

          dispatch(
            setDownloadState({
              branchName,
              buildName,
              totalBytes: totalSize,
              downloadedBytes: 0
            })
          );
        }
      }

      return totalSize;
    };

    const { branchName, buildName } = build;

    const { ftpConfig, localSettings } = getState();

    const accessOptions = {
      host: ftpConfig.url,
      user: ftpConfig.name,
      password: ftpConfig.pwd,
      secure: false
    };

    const ftpClient: FtpClient = new FtpClient();
    DO_NOT_GC_ME_PLEASE.push(ftpClient);
    ftpClient.ftp.verbose = false;

    try {
      dispatch({
        type: PLAYTEST_LOCAL_STATE_LOAD_START,
        payload: {
          branchName,
          buildName,
          state: ELocalState.Downloading
        }
      });

      await ftpClient.access(accessOptions);

      dispatch(
        setDownloadState({
          branchName,
          buildName,
          totalBytes: 0,
          downloadedBytes: 0,
          avgSpeed: 0
        })
      );
      const remoteSize = await fetchTrueRemoteSize(ftpClient);
      dispatch(
        setDownloadState({
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
            branchName,
            buildName,
            totalBytes: remoteSize,
            downloadedBytes: info.bytesOverall
          })
        );
      });

      await ftpClient.downloadToDir(
        path.join(localSettings.libraryPath, build.branchName, build.buildName),
        `${ftpConfig.path}/${build.buildName}`
        // `${ftpConfig.path}/${build.branchName}/${build.buildName}`
      );

      dispatch({
        type: PLAYTEST_LOCAL_STATE_LOAD_START,
        payload: {
          branchName,
          buildName,
          state: ELocalState.Ready
        }
      });
    } catch (error) {
      reportError('failed to read ftp config', error.message);
      dispatch({
        type: PLAYTEST_LOCAL_STATE_LOAD_START,
        payload: {
          branchName,
          buildName,
          state: ELocalState.Offline
        }
      });
    }
    ftpClient.close();
  };
}

export function fetchPlaytestsLocalBranches() {
  return async (dispatch: Dispatch, getState: GetState) => {
    const updateBuild = async (buildPath: string) => {
      const branchName = path.basename(path.dirname(buildPath));
      const buildName = path.basename(buildPath);

      dispatch({
        type: PLAYTEST_LOCAL_STATE_LOAD_START,
        payload: {
          branchName,
          buildName,
          state: ELocalState.PendingState
        }
      });

      try {
        await fs.promises.access(path.join(buildPath, 'build.info'), fs.constants.R_OK);
      } catch (error) {
        dispatch({
          type: PLAYTEST_LOCAL_STATE_LOAD_START,
          payload: {
            branchName,
            buildName,
            state: ELocalState.Offline
          }
        });

        return;
      }

      dispatch({
        type: PLAYTEST_LOCAL_STATE_LOAD_START,
        payload: {
          branchName,
          buildName,
          state: ELocalState.Ready
        }
      });
    };

    const fetchBuilds = async (buildsPath: string) => {
      const builds = await fs.promises.readdir(buildsPath, {
        withFileTypes: true
      });
      return builds
        .filter((build: Dirent) => build.isDirectory)
        .map(async (build: Dirent) => updateBuild(path.join(buildsPath, build.name)));
    };

    const fetchBranches = async (branchesPath: string) => {
      const branches = await fs.promises.readdir(branchesPath, {
        withFileTypes: true
      });

      await Promise.all(
        branches
          .filter((branch: Dirent) => branch.isDirectory)
          .map(async (branch: Dirent) => fetchBuilds(path.join(branchesPath, branch.name)))
      );
    };

    const { localSettings } = getState();

    dispatch({ type: PLAYTEST_LOCAL_STATE_SET_LIST_START });
    await fetchBranches(localSettings.libraryPath);
  };
}

export function fetchPlaytestRemoteEntryFromFtp(entry: PlaytestBaseState) {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: PLAYTEST_REMOTE_ENTRY_LOAD, payload: entry });

    const { ftpConfig, localSettings } = getState();

    const accessOptions = {
      host: ftpConfig.url,
      user: ftpConfig.name,
      password: ftpConfig.pwd,
      secure: false
    };

    while (staticFtpInstances > 0) {
      /* eslint no-await-in-loop: "off" */
      await sleep(100);
    }
    staticFtpInstances += 1;
    const ftpClient: FtpClient = new FtpClient();
    ftpClient.ftp.verbose = true;

    try {
      await ftpClient.access(accessOptions);

      const buildinfoFileName = 'build.info';
      const tmpFile = `${entry.branchName}_${entry.buildName}.buildinfo`;

      await ftpClient.downloadTo(
        path.join(localSettings.libraryPath, tmpFile),
        `${ftpConfig.path}/${entry.buildName}/${buildinfoFileName}`,
        0
      );

      const stringContent = await fs.promises.readFile(path.join(localSettings.libraryPath, tmpFile), {
        encoding: 'utf8',
        flag: 'r'
      });

      await fs.promises.unlink(path.join(localSettings.libraryPath, tmpFile));

      const remoteEntry: PlaytestRemoteState = { ...entry, playtestDesc: stringContent };
      dispatch({ type: PLAYTEST_REMOTE_ENTRY_SET, payload: remoteEntry });
    } catch (error) {
      reportError(error.message, error.message);
    }
    ftpClient.close();
    staticFtpInstances -= 1;
  };
}

export function fetchPlaytestsRemoteStateFromFtp() {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (getState()?.playtestsProvider?.providerState?.bIsLoading) {
      return;
    }

    dispatch({ type: PLAYTEST_REMOTE_STATE_LOAD_START });

    while (staticFtpInstances > 0) {
      /* eslint no-await-in-loop: "off" */
      await sleep(100);
    }

    staticFtpInstances += 1;

    const { ftpConfig } = getState();

    const accessOptions = {
      host: ftpConfig.url,
      user: ftpConfig.name,
      password: ftpConfig.pwd,
      secure: false
    };

    const ftpClient: FtpClient = new FtpClient();
    ftpClient.ftp.verbose = true;

    try {
      await ftpClient.access(accessOptions);
      const dirList: Array<FileInfo> = await ftpClient.list(ftpConfig.path);

      const list = dirList
        .filter(fileInfo => fileInfo.isDirectory)
        .map((fileInfo: FileInfo) => ({
          branchName: path.basename(ftpConfig.path),
          buildName: fileInfo.name,
          bIsImportant: false,
          playtestTitle: fileInfo.name,
          playtestDesc: fileInfo.size,
          bExtenedInfoSet: false,
          bPendingUpdate: false
        }));

      dispatch({ type: PLAYTEST_REMOTE_STATE_SET_LIST, payload: list });
    } catch (error) {
      reportError('failed to read ftp config', error.message);
      dispatch({ type: PLAYTEST_REMOTE_STATE_SET_LIST, payload: [] });
    }
    ftpClient.close();

    staticFtpInstances -= 1;
  };
}

export function test() {
  return {
    type: PLAYTEST_TEST
  };
}

export function testTwo() {
  return {
    type: PLAYTEST_TEST_TWO
  };
}

export function toggleListState(delay = 1000) {
  return (dispatch: Dispatch) => {
    setTimeout(() => {
      dispatch(testTwo());
    }, delay);
  };
}
