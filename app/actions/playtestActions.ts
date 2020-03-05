import electron from 'electron';
import fs, { Dirent } from 'fs';
import path from 'path';
import { Client as FtpClient, FileInfo } from 'basic-ftp';
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
  PLAYTEST_LOCAL_STATE_SET_LIST_START
} from '../reducers/actionTypes';
import { ELocalState, PlaytestBaseState } from '../reducers/playtestTypes';

export function reportError(message, error) {
  Console.log(message);
  Console.log(error);
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
    const configPath =
      '\\\\m1fsg5.mail.msk\\Games2$\\AT\\F1\\D1\\playtester.json';

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
    const { branchName, buildName } = build;

    const { ftpConfig, localSettings } = getState();

    const accessOptions = {
      host: ftpConfig.url,
      user: ftpConfig.name,
      password: ftpConfig.pwd,
      secure: false
    };

    const ftpClient: FtpClient = new FtpClient();
    ftpClient.ftp.verbose = true;

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
        await fs.promises.access(
          path.join(buildPath, 'build.info'),
          fs.constants.R_OK
        );
      } catch (error) {
        reportError(error.message, error.message);

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
        .map(async (build: Dirent) =>
          updateBuild(path.join(buildsPath, build.name))
        );
    };

    const fetchBranches = async (branchesPath: string) => {
      const branches = await fs.promises.readdir(branchesPath, {
        withFileTypes: true
      });

      await Promise.all(
        branches
          .filter((branch: Dirent) => branch.isDirectory)
          .map(async (branch: Dirent) =>
            fetchBuilds(path.join(branchesPath, branch.name))
          )
      );
    };

    const { localSettings } = getState();

    dispatch({ type: PLAYTEST_LOCAL_STATE_SET_LIST_START });
    await fetchBranches(localSettings.libraryPath);
  };
}

export function fetchPlaytestsRemoteStateFromFtp() {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: PLAYTEST_REMOTE_STATE_LOAD_START });

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
          playtestDesc: fileInfo.size
        }));

      dispatch({ type: PLAYTEST_REMOTE_STATE_SET_LIST, payload: list });
    } catch (error) {
      reportError('failed to read ftp config', error.message);
    }
    ftpClient.close();
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
