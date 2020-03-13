import { pathToRegexp } from 'path-to-regexp';
import sleep from 'await-sleep';
import queryString from 'querystring';
import { ipcRenderer } from 'electron';
import * as storage from 'redux-storage';
import React, { Fragment } from 'react';
import { render } from 'react-dom';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faTrash, fas } from '@fortawesome/free-solid-svg-icons';
import { Titlebar, Color } from 'custom-electron-titlebar';
import Root from './containers/Root';
import { configureStore, history, reduxStorageEngine } from './store/configureStore';
import '@fortawesome/fontawesome-free/js/all';
import './app.global.css';
import {
  setRandomSeed,
  setSelectedEntry,
  selectPathAndDownloadPlaytestBuild,
  fetchPlaytestsLocalBranches,
  updateRuntimeState,
  fetchPlaytestsRemoteStateFromFtp,
  launchClient
} from './actions/playtestActions';
import { PlaytestSelectedState, ELocalState } from './reducers/playtestTypes';

const rgb2hex = c =>
  `#${c
    .match(/\d+/g)
    .map(x => (+x).toString(16).padStart(2, 0))
    .join('')}`;

library.add(fas, faTrash);

const store = configureStore({});
const storageLoader = storage.createLoader(reduxStorageEngine);
storageLoader(store);
store.dispatch(setRandomSeed(Math.random()));

ipcRenderer.on('browseTo', (event, url) => {
  const asyncCall = async () => {
    if (!url) return;

    const splitUrl = url.split('?');
    history.push(url);
    const re = pathToRegexp('/playtest/:branchName/:buildName');
    const parseResult = re.exec(splitUrl[0]) as Array<string>;
    if (parseResult.length >= 3) {
      const query = splitUrl.length > 1 ? queryString.parse(splitUrl[1]) : {};

      const branchName = parseResult[1];
      const buildName = parseResult[2];
      const baseState = {
        branchName,
        buildName
      };

      const args = Object.keys(query).map(key => `-${key} ${query[key]}`);

      await store.dispatch(
        setSelectedEntry({
          branchName,
          buildName,
          args
        } as PlaytestSelectedState)
      );

      await store.dispatch(fetchPlaytestsRemoteStateFromFtp());
      await store.dispatch(fetchPlaytestsLocalBranches());
      await store.dispatch(updateRuntimeState());

      const localState = store
        .getState()
        .playtestsProvider.localState.find(entry => entry.branchName === branchName && entry.buildName === buildName);

      if (!localState || localState.state !== ELocalState.Ready) {
        await store.dispatch(selectPathAndDownloadPlaytestBuild(baseState));
      }

      let bNotReadyYet = true;
      do {
        const newLocalState = store
          .getState()
          .playtestsProvider.localState.find(entry => entry.branchName === branchName && entry.buildName === buildName);

        bNotReadyYet = !newLocalState || newLocalState.state !== ELocalState.Ready;
        /* eslint no-await-in-loop: "off" */
        await sleep(100);
      } while (bNotReadyYet);

      store.dispatch(launchClient(baseState, args));
    }
  };
  asyncCall();
});

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

document.addEventListener('DOMContentLoaded', () => {
  const bgColor = window.getComputedStyle(document.body, null).getPropertyValue('background-color');

  /* eslint no-new: "off" */
  new Titlebar({
    backgroundColor: Color.fromHex(rgb2hex(bgColor))
  });

  return render(
    <AppContainer>
      <Root store={store} history={history} />
    </AppContainer>,
    document.getElementById('root')
  );
});
