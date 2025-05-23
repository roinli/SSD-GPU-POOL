// Copyright (c) opensource-china Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/**
 * Implementation of Alert Handler.
 */

require('module-alias/register');
const express = require('express');
const bearerToken = require('express-bearer-token');
const actions = require('@alert-handler/routes/actions');
const k8sController = require('@alert-handler/controllers/kubernetes');
const logger = require('@alert-handler/common/logger');

const app = express();

app.use(express.json());
app.use(bearerToken());

app.use('/', actions);

const port = parseInt(process.env.SERVER_PORT);
app.listen(port, () => {
  logger.info(`alert-handler listening at http://localhost:${port}`);
});

// check completed jobs which were used to fix NvidiaGPULowPerf issue every 1 hour
setInterval(k8sController.cleanTTL24HJobs, 60 * 60 * 1000);
