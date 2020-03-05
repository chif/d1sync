import * as storage from 'redux-storage';
import React, { Fragment } from 'react';
import { render } from 'react-dom';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faTrash, fas } from '@fortawesome/free-solid-svg-icons';
import { Titlebar, Color } from 'custom-electron-titlebar';
import Root from './containers/Root';
import {
  configureStore,
  history,
  reduxStorageEngine
} from './store/configureStore';
import '@fortawesome/fontawesome-free/js/all';
import './app.global.css';

const rgb2hex = c =>
  `#${c
    .match(/\d+/g)
    .map(x => (+x).toString(16).padStart(2, 0))
    .join('')}`;

library.add(fas, faTrash);

const store = configureStore({});
const storageLoader = storage.createLoader(reduxStorageEngine);
storageLoader(store);

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

document.addEventListener('DOMContentLoaded', () => {
  const bgColor = window
    .getComputedStyle(document.body, null)
    .getPropertyValue('background-color');

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
