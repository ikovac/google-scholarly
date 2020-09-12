'use strict';

const cheerio = require('cheerio');
const got = require('got');

const PROXY_URL = 'http://api.proxiesapi.com';
const SCHOLAR_BASE_URL = 'https://scholar.google.com';

class ProxyError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'ProxyError';
  }
}

const isHTTPError = (err, { statusCode }) => {
  return err instanceof got.HTTPError &&
    err.response.statusCode === statusCode;
};

const client = got.extend({
  mutableDefaults: true,
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

const selectors = {
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
  init(key) {
    client.defaults.options = got.mergeOptions(client.defaults.options, {
      prefixUrl: PROXY_URL,
      searchParams: { auth_key: key }
    });
    return this;
  }

  request(url) {
    url = url.href || url;
    const searchParams = { url };
    return client.get({ searchParams });
  }

  async searchPub(query) {
    const url = new URL('scholar', SCHOLAR_BASE_URL);
    url.searchParams.set('q', query);
    const result = await this.request(url);
    return this.parsePub(result.body);
  }

  async getAuthorProfile(link) {
    const url = new URL(link, SCHOLAR_BASE_URL);
    const result = await this.request(url);
    return this.parseAuthorProfile(result.body);
  }

  async getPubAuthors(query) {
    const { authors } = await this.searchPub(query);
    if (!authors) {
      return;
    }
    return Promise.all(authors.map(({ url }) => this.getAuthorProfile(url)));
  }

  parsePub(html) {
    const { pub } = selectors;
    const $ = cheerio.load(html);
    const $publicationContainer = $(pub.container).first();

    const $authors = $publicationContainer.find(pub.authors);
    const authors = $authors.map((_, el) => {
      const $el = $(el);
      const name = $el.text();
      const url = $el.attr('href');
      return { name, url };
    }).get();

    const title = $publicationContainer.find(pub.title).text();
    return { title, authors };
  }

  parseAuthorProfile(html) {
    const { author } = selectors;
    const $ = cheerio.load(html);
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
module.exports.ProxyError = ProxyError;
