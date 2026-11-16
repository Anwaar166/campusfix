const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const patchScript = path.resolve(__dirname, 'patch-node.js');

// 1. fs.readlinkSync
const origReadlinkSync = fs.readlinkSync;
if (origReadlinkSync) {
  fs.readlinkSync = function (p, options) {
    try {
      return origReadlinkSync.call(fs, p, options);
    } catch (err) {
      if (err && err.code === 'EISDIR') {
        const e = new Error('EINVAL: invalid argument, readlink');
        e.code = 'EINVAL';
        throw e;
      }
      throw err;
    }
  };
}

// 2. fs.readlink
const origReadlink = fs.readlink;
if (origReadlink) {
  fs.readlink = function (p, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    origReadlink.call(fs, p, options, (err, linkString) => {
      if (err && err.code === 'EISDIR') {
        const e = new Error('EINVAL: invalid argument, readlink');
        e.code = 'EINVAL';
        return callback(e);
      }
      callback(err, linkString);
    });
  };
}

// 3. fs.promises.readlink
if (fs.promises && fs.promises.readlink) {
  const origPromisesReadlink = fs.promises.readlink;
  fs.promises.readlink = async function (p, options) {
    try {
      return await origPromisesReadlink.call(fs.promises, p, options);
    } catch (err) {
      if (err && err.code === 'EISDIR') {
        const e = new Error('EINVAL: invalid argument, readlink');
        e.code = 'EINVAL';
        throw e;
      }
      throw err;
    }
  };
}

// 4. Ensure child workers inherit NODE_OPTIONS
const ensureNodeOptions = (env) => {
  const current = (env && env.NODE_OPTIONS) || process.env.NODE_OPTIONS || '';
  if (!current.includes('patch-node.js')) {
    return current ? `${current} --require "${patchScript}"` : `--require "${patchScript}"`;
  }
  return current;
};

if (cp.fork) {
  const origFork = cp.fork;
  cp.fork = function (modulePath, args, options) {
    options = options || {};
    options.env = Object.assign({}, process.env, options.env || {});
    options.env.NODE_OPTIONS = ensureNodeOptions(options.env);
    return origFork.call(cp, modulePath, args, options);
  };
}

if (cp.spawn) {
  const origSpawn = cp.spawn;
  cp.spawn = function (command, args, options) {
    if (typeof args === 'object' && !Array.isArray(args)) {
      options = args;
      args = [];
    }
    options = options || {};
    options.env = Object.assign({}, process.env, options.env || {});
    options.env.NODE_OPTIONS = ensureNodeOptions(options.env);
    return origSpawn.call(cp, command, args, options);
  };
}
