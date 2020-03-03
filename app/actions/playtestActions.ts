import electron from 'electron';
import fs from 'fs';
import path from 'path';
import * as sleep from 'await-sleep';
import { Client as FtpClient, FileInfo } from 'basic-ftp';
import { Dispatch, GetState } from '../reducers/types';
import {
  PLAYTEST_TEST,
  PLAYTEST_TEST_TWO,
  FTP_CONFIG_LOAD_FINISH,
  FTP_CONFIG_LOAD_START,
  PLAYTEST_SET_LIST,
  PLAYTEST_LOAD_START,
  LOCAL_SETTINGS_UPDATE_LIBRARY_PATH
} from '../reducers/actionTypes';

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
      await sleep(1000);
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

export function loadPlaytestsFromFtp() {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: PLAYTEST_LOAD_START });

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

      const list = dirList.map((fileInfo: FileInfo) => ({
        branchName: path.dirname(ftpConfig.path),
        buildName: fileInfo.name,
        bIsImportant: false,
        playtestTitle: fileInfo.name,
        playtestDesc: fileInfo.size
      }));

      dispatch({ type: PLAYTEST_SET_LIST, payload: list });
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
