'use strict';

const proxy = 'http://localhost:9090';

Object.assign(process.env, {
  NODE_TLS_REJECT_UNAUTHORIZED: 0,
  GLOBAL_AGENT_HTTP_PROXY: process.env.GLOBAL_AGENT_HTTP_PROXY || proxy,
  GLOBAL_AGENT_HTTPS_PROXY: process.env.GLOBAL_AGENT_HTTPS_PROXY || proxy
});

require('global-agent/bootstrap');
