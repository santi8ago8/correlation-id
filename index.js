'use strict';

const uuid = require('uuid');
const asyncHook = require('async_hooks');

const store = new Map();
let currentUid = null;

function init (uid, type, triggerId) { 
  if (store.has(triggerId || currentUid)) {
    store.set(uid, store.get(triggerId || currentUid));
  }
}

function before (uid) {    
  currentUid = uid;
}

function after () {
  currentUid = null;
}

function destroy (uid) {
  if (store.has(uid)) {
    store.delete(uid);
  }
}

function createContext (id) {
  if (!currentUid) {
    throw new Error('`createContext` must be called in an async handle.');
  }
  
  store.set(currentUid, id);    
}

function isFunction (object) {
  return typeof object === 'function';
}

function configureArgs (func) {
  return (id, work) => {
    if (!work && isFunction(id)) {
      work = id;
      id = uuid.v4();
    }

    if (!work) {
      throw new Error('Missing work parameter');
    }

    return func(id, work);
  };
}

function withId (id, work) {
  createContext(id);
  work(id);
}

function bindId (id, work) {
  return function () {
    createContext(id);
    work.apply(null, [].slice.call(arguments));    
  };
}

function getId () {
  return store.get(currentUid);
}

asyncHook.createHook({ init, before, after, destroy }).enable();

module.exports = {
  withId: configureArgs(withId),
  bindId: configureArgs(bindId),
  getId
};
