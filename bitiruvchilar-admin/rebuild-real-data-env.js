'use strict';
// One-time, versioned production rebuild runner. Payload is provided only through Railway environment variables and is never committed.
require('./lib/run-real-rebuild')();
