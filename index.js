'use strict';

const cheerio = require('cheerio');
const got = require('got');

const PROXY_URL = 'http://api.proxiesapi.com';
const SCHOLAR_BASE_URL = 'https://scholar.google.com';

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

const isHTTPError = (err, { statusCode }) => {
  return err instanceof got.HTTPError &&
    err.response.statusCode === statusCode;
};

class Scholar {
  init(key) {
    this.apiKey = key;

    const baseUrl = new URL(PROXY_URL);
    baseUrl.searchParams.set('auth_key', this.apiKey);
    this.baseUrl = baseUrl;

    return this;
  }

  request(url) {
    const searchUrl = this.baseUrl;
    searchUrl.searchParams.set('url', url);
    return got(searchUrl.href);
  }

  async searchPub(query) {
    const url = new URL('scholar', SCHOLAR_BASE_URL);
    url.searchParams.set('q', query);
    try {
      const result = await this.request(url.href);
      return this.parsePub(result.body);
    } catch (error) {
      if (isHTTPError(error, { statusCode: 401 })) {
        throw new Error('Api key invalid or expired');
      }
      throw error;
    }
  }

  async getAuthorProfile(link) {
    const url = new URL(link, SCHOLAR_BASE_URL);
    try {
      const result = await this.request(url.href);
      return this.parseAuthorProfile(result.body);
    } catch (error) {
      if (isHTTPError(error, { statusCode: 401 })) {
        throw new Error('Api key invalid or expired');
      }
      throw error;
    }
  }

  async getPubAuthors(query) {
    const { authors } = await this.searchPub(query);
    if (!authors) {
      return;
    }
    return Promise.all(authors.map(async ({ id, url }) => {
      const profile = await this.getAuthorProfile(url);
      return { id, ...profile };
    }));
  }

  parsePub(html) {
    const { pub } = selectors;
    const $ = cheerio.load(html);
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
