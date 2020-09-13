'use strict';

const { createGlobalProxyAgent } = require('global-agent');

const globalAgent = createGlobalProxyAgent();
globalAgent.HTTP_PROXY = globalAgent.HTTP_PROXY || getEnvVar(['HTTP_PROXY', 'http_proxy']);
globalAgent.HTTPS_PROXY = globalAgent.HTTPS_PROXY || getEnvVar(['HTTPS_PROXY', 'https_proxy']);
globalAgent.NO_PROXY = globalAgent.NO_PROXY || getEnvVar(['NO_PROXY', 'no_proxy']);

function getEnvVar(names = []) {
  const name = names.find(name => process.env[name]);
  if (!name) return;
  const value = process.env[name];
  // NOTE: Do NOT alter library behaviour!
  // See https://github.com/gajus/global-agent/tree/c663c62#what-is-the-reason-global-agentbootstrap-does-not-use-http_proxy
  delete process.env[name];
  return value;
}
