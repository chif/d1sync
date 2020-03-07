import { pathToRegexp } from 'path-to-regexp';
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
import { setRandomSeed, setSelectedEntry } from './actions/playtestActions';

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
  history.push(url);
  const re = pathToRegexp('/playtest/:branchName/:buildName');
  const parseResult = re.exec(url) as Array<string>;
  if (parseResult.length >= 3) {
    store.dispatch(
      setSelectedEntry({
        branchName: parseResult[1],
        buildName: parseResult[2]
      })
    );
  }
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
