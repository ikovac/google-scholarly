'use strict';

const cheerio = require('cheerio');
const got = require('got');
const pRetry = require('p-retry');

const PROXY_URL = 'http://api.proxiesapi.com';
const SCHOLAR_BASE_URL = 'https://scholar.google.com';

class ScholarlyError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'ScholarlyError';
  }
}

class CaptchaError extends ScholarlyError {
  constructor(msg) {
    super(msg);
    this.name = 'CaptchaError';
  }
}

class ProxyError extends ScholarlyError {
  constructor(msg) {
    super(msg);
    this.name = 'ProxyError';
  }
}

const isCaptchaError = err => err instanceof CaptchaError;
const isHTTPError = (err, { statusCode }) => {
  return err instanceof got.HTTPError &&
    err.response.statusCode === statusCode;
};

const selectors = {
  captcha: {
    message: '[id^="gs_captcha"] h1'
  },
  pub: {
    container: '.gs_ri',
    title: '.gs_rt',
    authors: '.gs_a a'
  },
  author: {
    container: '#gsc_prf',
    name: '#gsc_prf_in',
    affiliation: '#gsc_prf_in + .gsc_prf_il',
    domain: '#gsc_prf_ivh',
    homepage: '#gsc_prf_ivh a',
    interests: '#gsc_prf_int a',
    metrics: '#gsc_rsb_st tr:nth-of-type(2) .gsc_rsb_std'
  }
};

class Scholar {
  init(apiKey, { retries } = {}) {
    const useProxy = !!apiKey;
    this.useProxy = useProxy;

    let client = this._setupClient();
    if (useProxy) client = this._setupProxy(client, apiKey);
    this.client = client;

    if (retries === undefined) retries = useProxy ? 2 : 0;
    this.retries = Math.min(0, retries);

    return this;
  }

  _setupClient() {
    return got.extend({
      handlers: [
        (options, next) => {
          if (options.isStream) return next(options);
          return (async () => {
            const resp = await next(options);
            const $html = cheerio.load(resp.body);
            const body = this._verifyPage($html);
            return Object.assign(resp, { body });
          })();
        }
      ]
    });
  }

  _setupProxy(client, apiKey) {
    return client.extend({
      prefixUrl: PROXY_URL,
      searchParams: { auth_key: apiKey },
      handlers: [
        (options, next) => {
          if (options.isStream) return next(options);
          return next(options).catch(error => {
            if (isHTTPError(error, { statusCode: 401 })) {
              throw new ProxyError('Api key invalid or expired');
            }
            throw error;
          });
        }
      ]
    });
  }

  _verifyPage($html) {
    const $ = $html;
    const { captcha } = selectors;

    const captchaMessage = $(captcha.message).text();
    if (captchaMessage) {
      throw new CaptchaError(captchaMessage);
    }

    return $html;
  }

  request(url) {
    url = url.href || url;
    return pRetry(() => {
      if (!this.usesProxy) return this.client.get(url);
      const searchParams = { url };
      return this.client.get({ searchParams });
    }, {
      retries: this.retries,
      onFailedAttempt(error) {
        if (!isCaptchaError(error)) {
          throw error;
        }
      }
    });
  }

  async searchPub(query) {
    const url = new URL('scholar', SCHOLAR_BASE_URL);
    url.searchParams.set('q', query);
    const resp = await this.request(url);
    return this.parsePub(resp.body);
  }

  async getAuthorProfile(link) {
    const url = new URL(link, SCHOLAR_BASE_URL);
    const resp = await this.request(url);
    return this.parseAuthorProfile(resp.body);
  }

  async getPubAuthors(query) {
    const { authors } = await this.searchPub(query);
    return Promise.all(authors.map(async ({ id, url }) => {
      const profile = await this.getAuthorProfile(url);
      return { id, ...profile };
    }));
  }

  parsePub($html) {
    const $ = $html;
    const { pub } = selectors;
    const $publicationContainer = $(pub.container).first();

    const $authors = $publicationContainer.find(pub.authors);
    const authors = $authors.map((_, el) => {
      const $el = $(el);
      const name = $el.text();
      const url = new URL($el.attr('href'), SCHOLAR_BASE_URL);
      const id = url.searchParams.get('user');
      return { id, name, url: url.href };
    }).get();

    const title = $publicationContainer.find(pub.title).text();
    return { title, authors };
  }

  parseAuthorProfile($html) {
    const $ = $html;
    const { author } = selectors;
    const $profileContainer = $(author.container);

    const name = $profileContainer.find(author.name).text();
    const affiliation = $profileContainer.find(author.affiliation).text();
    const homepage = $profileContainer.find(author.homepage).attr('href');

    const $domain = $profileContainer.find(author.domain);
    const emailInfo = $domain[0].childNodes[0].data.trim();
    const domain = emailInfo.split(/\s+/g).filter(token => token !== '-').pop();

    const $interests = $profileContainer.find(author.interests);
    const interests = $interests.map((_, el) => $(el).text()).get();

    const hindex = $(author.metrics).first().text();

    return { name, affiliation, homepage, domain, hindex, interests };
  }
}

module.exports = new Scholar();
module.exports.ScholarlyError = ScholarlyError;
module.exports.CaptchaError = CaptchaError;
module.exports.ProxyError = ProxyError;
