import { promisify } from 'util';
import electron from 'electron';
import { snapshot } from 'process-list';
import { spawn } from 'child_process';
import fs, { Dirent } from 'fs';
import fse from 'fs-extra';
import filesystem from 'fs-filesystem';
import path from 'path';
import { Client as FtpClient, FileInfo } from 'basic-ftp';
import { ProgressInfo } from 'basic-ftp/dist/ProgressTracker';
import sleep from 'await-sleep';
import { shallowEqual } from 'react-redux';
import { Dispatch, GetState, LocalDriveInfo } from '../reducers/types';
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
  PLAYTEST_SELECTED_ENTRY_SET,
  PLAYTEST_RUNTIME_STATE_SET,
  LOCAL_DRIVE_INFO_SET
} from '../reducers/actionTypes';
import {
  ELocalState,
  PlaytestBaseState,
  PlaytestRemoteState,
  PlaytestDownloadState,
  ESelectedState,
  PlaytestRuntimeState,
  EPlaytestRuntimeState,
  EDownloadState
} from '../reducers/playtestTypes';
import downloadPackedPlaytestBuild from './ftpPackedActions';

const DO_NOT_GC_ME_PLEASE = [];
let staticFtpInstances = 0;

function reportError() {}

export function ensurePathExists();

export function setRandomSeed(inSeed: number) {
  return {
    type: RANDOM_SEED_SET,
    payload: inSeed
  };
}

export function setSelectedEntry(entry: PlaytestBaseState) {
  return {
    type: PLAYTEST_SELECTED_ENTRY_SET,
    payload: entry,
    state: ESelectedState.WantToDownload
  };
}

function setDownloadState(state: PlaytestDownloadState) {
  return {
    type: PLAYTEST_DOWNLOAD_STATE_SET,
    payload: state
  };
}

export function updateLocalDriveInfo() {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { libraryPath } = getState().localSettings;
    // totally safe
    const driveLetter = libraryPath.substr(0, 2);

    const asyncFilesystem = promisify(filesystem);

    type FileSystemVolume = {
      id: string;
      node: string;
      whole: boolean;
      parent: string;
      name: string;
      description: string;
      blockSize: number;
      blocks: number;
      readOnly: boolean;
      mounted: boolean;
      mountPoint: boolean;
      partitionType: string;
      fs: string;
      space: {
        total: number;
        available: number;
        used: number;
      };
    };

    type FileSystemDevice = {
      id: string;
      node: string;
      whole: boolean;
      parent: string;
      name: string;
      size: integer;
      description: string;
      protocol: string;
      blockSize: integer;
      readOnly: boolean;
      removable: boolean;
      volumes: Array<FileSystemVolume>;
    };

    const emptyPayload: LocalDriveInfo = {
      additionalSpaceNeeded: 0,
      bPendingUpdate: true,
      spaceAvailable: 0
    };

    try {
      const fileSystemResult = await asyncFilesystem(driveLetter);

      const keys = Object.keys(fileSystemResult.devices);
      if (keys.length === 0) {
        throw new Error('drive not found');
      }

      const device = fileSystemResult.devices[keys[0]] as FileSystemDevice;
      const volume = device.volumes.find(currentVolume => currentVolume.id === driveLetter);
      if (!volume) {
        throw new Error('volume not found');
      }

      dispatch({
        type: LOCAL_DRIVE_INFO_SET,
        payload: {
          spaceAvailable: volume.space.available,
          bPendingUpdate: false,
          additionalSpaceNeeded: Math.max(0, 5 * 1024 * 1024 * 1024 - volume.space.available)
        } as LocalDriveInfo
      });
    } catch (error) {
      reportError(error);

      dispatch({ type: LOCAL_DRIVE_INFO_SET, payload: emptyPayload });
    }
  };
}

export function selectLibraryPath() {
  return async (dispatch: Dispatch) => {
    const dialog = electron.dialog || electron.remote.dialog;
    const dir = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (!dir.canceled) {
      let selectedDir = dir.filePaths[0];
      if (selectedDir && selectedDir.length < 4) {
        selectedDir = path.join(selectedDir, 'd1playtests');
      }
      await fse.ensureDir(selectedDir);
      dispatch({
        type: LOCAL_SETTINGS_UPDATE_LIBRARY_PATH,
        payload: selectedDir
      });
    }
  };
}

export function autoSelectLibraryPath() {
  return async (dispatch: Dispatch) => {
    type FileSystemVolume = {
      id: string;
      node: string;
      whole: boolean;
      parent: string;
      name: string;
      description: string;
      blockSize: number;
      blocks: number;
      readOnly: boolean;
      mounted: boolean;
      mountPoint: boolean;
      partitionType: string;
      fs: string;
      space: {
        total: number;
        available: number;
        used: number;
      };
    };

    type FileSystemDevice = {
      id: string;
      node: string;
      whole: boolean;
      parent: string;
      name: string;
      size: integer;
      description: string;
      protocol: string;
      blockSize: integer;
      readOnly: boolean;
      removable: boolean;
      volumes: Array<FileSystemVolume>;
    };

    try {
      const asyncFilesystem = promisify(filesystem);
      const fileSystemResult = await asyncFilesystem();

      const keys = Object.keys(fileSystemResult.devices);
      if (keys.length === 0) {
        throw new Error('drive not found');
      }

      const hugeVolume = keys
        .map(key => fileSystemResult.devices[key])
        .filter((device: FileSystemDevice) => device.description === 'Local Fixed Disk')
        .flatMap(device => device.volumes)
        .reduce((prev, current) => (current?.space.available > prev?.space.available ? current : prev));

      if (hugeVolume) {
        const newDir = path.join(hugeVolume.id, 'd1playtests');
        await fse.ensureDir(newDir);
        await dispatch({
          type: LOCAL_SETTINGS_UPDATE_LIBRARY_PATH,
          payload: newDir
        });

        await dispatch(updateLocalDriveInfo());
      }
    } catch (error) {
      reportError(error);
    }
  };
}

export function loadFtpConfig() {
  return async (dispatch: Dispatch) => {
    dispatch({ type: FTP_CONFIG_LOAD_START });
    const configPath = '\\\\m1fsg5.mail.msk\\Games2$\\AT\\F1\\D1\\playtester.json';

    try {
      const data = await fse.readFile(configPath, {
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
        await fse.access(path.join(buildPath, 'build.info'), fs.constants.R_OK);
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
      const builds = await fse.readdir(buildsPath, {
        withFileTypes: true
      });
      return builds
        .filter((build: Dirent) => build.isDirectory && parseInt(build.name, 10) > 0)
        .map(async (build: Dirent) => updateBuild(path.join(buildsPath, build.name)));
    };

    const fetchBranches = async (branchesPath: string) => {
      const branches = await fse.readdir(branchesPath, {
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
    if (!localSettings.libraryPath) {
      throw new Error('invalid library path');
    }

    if (localSettings.libraryPath.length < 4) {
      throw new Error('can not use drive root as library path');
    }
    await fse.ensureDir(localSettings.libraryPath);
    await fetchBranches(localSettings.libraryPath);
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
              state: EDownloadState.Downloading,
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
      const remoteSize = await fetchTrueRemoteSize(ftpClient);
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

      await fse.ensureDir(localSettings.libraryPath);
      await ftpClient.downloadToDir(
        path.join(localSettings.libraryPath, build.branchName, build.buildName),
        `${ftpConfig.path}/${build.buildName}`
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

export function selectPathAndDownloadPlaytestBuild(build: PlaytestBaseState) {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (!getState().localSettings.bPathWasSetByUser) {
      await dispatch(selectLibraryPath());
    }
    if (getState().localSettings.bPathWasSetByUser) {
      // await dispatch(downloadPlaytestBuild(build));
      await dispatch(downloadPackedPlaytestBuild(build));
      await dispatch(fetchPlaytestsLocalBranches());
    }
  };
}

export function deleteLocalBuild(build: PlaytestBaseState) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { localSettings } = getState();
    const { buildName, branchName } = build;

    dispatch({
      type: PLAYTEST_LOCAL_STATE_LOAD_START,
      payload: {
        branchName,
        buildName,
        state: ELocalState.Deleting
      }
    });

    try {
      await fse.access(
        path.join(localSettings.libraryPath, build.branchName, build.buildName, 'build.info'),
        fs.constants.R_OK
      );

      await fse.remove(path.join(localSettings.libraryPath, build.branchName, build.buildName));
      dispatch(fetchPlaytestsLocalBranches());
    } catch (error) {
      reportError(error);
      dispatch(fetchPlaytestsLocalBranches());
    }
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

      await fse.ensureDir(localSettings.libraryPath);
      await ftpClient.downloadTo(
        path.join(localSettings.libraryPath, tmpFile),
        `${ftpConfig.path}/${entry.buildName}/${buildinfoFileName}`,
        0
      );

      await fse.ensureDir(localSettings.libraryPath);
      const stringContent = await fse.readFile(path.join(localSettings.libraryPath, tmpFile), {
        encoding: 'utf8',
        flag: 'r'
      });

      await fse.unlink(path.join(localSettings.libraryPath, tmpFile));

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

export function updateRuntimeState() {
  const DEVIOUS_CLIENT = 'devious.exe';
  const DEVIOUS_SERVER = 'deviousserver.exe';
  const WHITELIST = [DEVIOUS_CLIENT, DEVIOUS_SERVER];

  return async (dispatch: Dispatch, getState: GetState) => {
    type ProcessDescriptor = {
      name: string;
      path: string;
      cmdline: string;
    };

    const allProcesses = (await snapshot('name', 'path', 'cmdline')) as Array<ProcessDescriptor>;

    const getBuildInfo = (descriptor: ProcessDescriptor): PlaytestBaseState => {
      const buildPath = path.dirname(path.dirname(path.dirname(path.dirname(descriptor.path))));
      return {
        buildName: path.basename(buildPath),
        branchName: path.basename(path.dirname(buildPath))
      };
    };

    const assignRuntimeState = (descriptor: ProcessDescriptor, outEntry: PlaytestRuntimeState) => {
      if (descriptor.name.toLocaleLowerCase() === DEVIOUS_SERVER) {
        outEntry.bServerState = EPlaytestRuntimeState.Running;
      } else {
        outEntry.bClientState = EPlaytestRuntimeState.Running;
      }
    };

    const result: Array<PlaytestRuntimeState> = [];

    allProcesses
      .filter(entry => WHITELIST.indexOf(entry.name.toLocaleLowerCase()) >= 0)
      .forEach(descriptor => {
        const baseState = getBuildInfo(descriptor);
        const currentEntry = result.find(
          resultEntry =>
            resultEntry.branchName === baseState.branchName && resultEntry.buildName === baseState.buildName
        );

        if (currentEntry) {
          assignRuntimeState(descriptor, currentEntry);
        } else {
          const newEntry: PlaytestRuntimeState = {
            branchName: baseState.branchName,
            buildName: baseState.buildName
          };
          assignRuntimeState(descriptor, newEntry);
          result.push(newEntry);
        }
      });

    if (!shallowEqual(getState().playtestsProvider.runtimeState, result)) {
      dispatch({ type: PLAYTEST_RUNTIME_STATE_SET, payload: result });
    }
  };
}

export function startApp(cmd: string, args?: string[]) {
  return async (dispatch: Dispatch) => {
    spawn(path.basename(cmd), args, {
      cwd: path.dirname(cmd),
      detached: true,
      windowsVerbatimArguments: true
    });

    dispatch(updateRuntimeState());
  };
}

export function stopApp(partialPath: string) {
  return async (dispatch: Dispatch) => {
    type ProcessDescriptor = {
      pid: string;
      name: string;
      path: string;
      cmdline: string;
    };

    const allProcesses = (await snapshot('pid', 'name', 'path', 'cmdline')) as Array<ProcessDescriptor>;
    const target = allProcesses.find(
      descriptor => descriptor.path.toLocaleLowerCase() === partialPath.toLocaleLowerCase()
    );
    if (target && target.pid) {
      process.kill(target.pid, 'SIGTERM');
    }

    dispatch(updateRuntimeState());
  };
}

// TODO: переделать разахрдоженные пути. или нет
export function launchClient(entry: PlaytestBaseState, args: string[]) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { localSettings } = getState();

    const runtimeState = getState().playtestsProvider.runtimeState.find(
      runtimeEntry => runtimeEntry.branchName === entry.branchName && runtimeEntry.buildName === entry.buildName
    );

    if (runtimeState && runtimeState.bClientState === EPlaytestRuntimeState.Running) {
      return;
    }

    const pathToClientExeDevelopment = path.join(
      localSettings.libraryPath,
      entry.branchName,
      entry.buildName,
      'Client',
      'Development',
      'WindowsNoEditor',
      'Devious.exe'
    );

    dispatch(startApp(pathToClientExeDevelopment, args));
  };
}

export function stopClient(entry: PlaytestBaseState) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { localSettings } = getState();

    const pathToClientExeDevelopment = path.join(
      localSettings.libraryPath,
      entry.branchName,
      entry.buildName,
      'Client',
      'Development',
      'WindowsNoEditor',
      'Devious',
      'Binaries',
      'Win64',
      'Devious.exe'
    );

    dispatch(stopApp(pathToClientExeDevelopment));
  };
}

export function launchServer(entry: PlaytestBaseState) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { localSettings } = getState();

    const pathToServerExeDevelopment = path.join(
      localSettings.libraryPath,
      entry.branchName,
      entry.buildName,
      'Server',
      'Development',
      'WindowsServer',
      'DeviousServer.exe'
    );

    dispatch(startApp(pathToServerExeDevelopment, ['-log']));
  };
}

export function stopServer(entry: PlaytestBaseState) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { localSettings } = getState();
    const pathToServerExeDevelopment = path.join(
      localSettings.libraryPath,
      entry.branchName,
      entry.buildName,
      'Server',
      'Development',
      'WindowsServer',
      'Devious',
      'Binaries',
      'Win64',
      'DeviousServer.exe'
    );

    dispatch(stopApp(pathToServerExeDevelopment));
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
