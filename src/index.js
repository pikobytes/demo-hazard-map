/* eslint-disable max-len */
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Router, Route } from 'react-router-dom';
import { routerReducer, syncHistoryWithStore } from 'react-router-redux';
import { RouterToUrlQuery } from 'react-url-query';
import { combineReducers, createStore } from 'redux';
import { createHashHistory } from 'history';
import { detect } from 'detect-browser';

import './index.css';
import App from './componentapp';

// Element Id of the app container. The content of this element is replaced with
// the application rendered content.
const APP_CONTAINER_ID = 'app-container';

// fallback behavior in case the user uses firefox
const browserNameIE = detect().name === 'ie';
if (browserNameIE) {
  const containerEl = document.getElementById(APP_CONTAINER_ID);
  const defaultMsg = 'Haben Sie anschließend immer noch Probleme wenden Sie sich bitte an <a href="mailto:info@pikobytes.de" title="Contact Email">info@pikobytes.de</a>.';
  const customMsg = browserNameIE
    ? '<h2>Fehlende Browser Unterstüzung</h2><div>Die Anwendung unterstützt keinen Internet Explorer. Bitte wechseln Sie zu einem neueren Browser wie Chrome, Firefox, Edge, Opera oder Safari. '
    : '<h2>Fehlende WebGL Unterstüzung</h2><div>Ihr Browser unterstützt kein WebGL. Bitte wechseln Sie zu einer neueren Browser-Version von Chrome, Firefox, Edge, Opera oder Safari. ';
  const msg = document.createElement('h1');
  msg.innerHTML = `<div class="missing-browser-support">${customMsg}${defaultMsg}</div></div>`;
  containerEl.innerHTML = '';
  containerEl.appendChild(msg);
} else {
  // create a redux store and add the reducer to your store on the `routing` key
  // and mount the store
  const store = createStore(
    combineReducers({
      routing: routerReducer,
    }),
  );

  // create a hashHistory for single application routing and bind it with the
  // redux store
  const hashHistory = createHashHistory();
  syncHistoryWithStore(hashHistory, store);

  const Main = () => (
    <Provider store={store}>
      <Router history={hashHistory}>
        <RouterToUrlQuery>
          <Route excat path="/" component={App} />
        </RouterToUrlQuery>
      </Router>
    </Provider>
  );

  ReactDOM.render(<Main />, document.getElementById(APP_CONTAINER_ID));
}
