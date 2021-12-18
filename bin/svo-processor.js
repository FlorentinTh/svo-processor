#!/usr/bin/env node

import SVOProcessor from '../src/SVOProcessor.js';

(async () => {
  const svoProcessor = new SVOProcessor();
  await svoProcessor.run();
})();
