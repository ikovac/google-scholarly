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
    title: '.gs_rt a',
    authors: '.gs_a a'
  },
  author: {
    container: '#gsc_prf',
    name: '#gsc_prf_in',
    affiliation: '#gsc_prf_in + .gsc_prf_il',
    domain: '#gsc_prf_ivh',
    homepage: '#gsc_prf_ivh a',
    interests: '#gsc_prf_int a',
    citations: '#gsc_rsb_st tr:first-child .gsc_rsb_std',
    citations5y: '#gsc_rsb_st tr:first-child .gsc_rsb_std:nth-of-type(3)',
    metrics: '#gsc_rsb_st tr:nth-of-type(2) .gsc_rsb_std',
    metrics5y: '#gsc_rsb_st tr:nth-of-type(2) .gsc_rsb_std:nth-of-type(3)',
    i10index: '#gsc_rsb_st tr:nth-of-type(3) .gsc_rsb_std',
    i10index5y: '#gsc_rsb_st tr:nth-of-type(3) .gsc_rsb_std:nth-of-type(3)'
  },
  publications: {
    title: '.gsc_a_t a',
    authors: '.gsc_a_t div:nth-of-type(1)',
    journal: '.gsc_a_t div:nth-of-type(2)',
    citedby: '.gsc_a_c a',
    year: '.gsc_a_y span'
  },
  search: {
    container: '#gsc_sa_ccl',
    link: '.gs_ai_name a'
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
    this.retries = Math.max(0, retries);

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
      if (!this.useProxy) return this.client.get(url);
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

  async getAuthorID(query) {
    const url = new URL('citations', SCHOLAR_BASE_URL);
    url.searchParams.set('view_op', 'search_authors');
    url.searchParams.set('mauthors', query);
    const resp = await this.request(url);
    return this.parseAuthorSearch(resp.body);
  }

  async getAuthorProfile(id, limit = 100, sortby = 'citedby') {
    // limit is 20 by default
    var cstart = 0;
    var pagesize = 100; // 100 is the maximum can get at a time
    var flag = false;
    // sortby = sortby != "citedby" ? "&view_op=list_works&sortby=pubdate" : "";
    if (limit && limit != 'all' && limit < pagesize) {
    // if (limit && limit<pagesize) {
      console.log(1, 'limit');
      pagesize = limit;
      flag = true;
    }
    var publications = [];
    var data = {};
    while (true) {
      const url = new URL('citations', SCHOLAR_BASE_URL);
      url.searchParams.set('user', id);
      url.searchParams.set('cstart', cstart);
      url.searchParams.set('pagesize', pagesize);
      if (sortby != 'citedby') {
        url.searchParams.set('view_op', 'list_works');
        url.searchParams.set('sortby', 'pubdate');
      }
      const resp = await this.request(url);
      if (cstart == 0) {
        data = this.parseAuthorProfile(resp.body);
      }
      const $ = resp.body;
      const pubs = $('#gsc_a_t tbody tr');
      for (var i = 0; i < pubs.length; i++) {
        if (limit != 'all' && publications.length >= limit) {
        // if (publications.length >= limit) {
          console.log(2, 'limit');
          flag = true;
          break;
        }
        const pub = this.parseAuthorPub(pubs[i]);
        publications.push(pub);
      }
      if ($('button#gsc_bpf_more').is('[disabled=]') != true && !flag) {
        cstart += pagesize;
      } else {
        break;
      }
    }
    // if (publications) {
    data.publications = publications;
    // }
    return data;
  }

  async searchPub(query) {
    const url = new URL('scholar', SCHOLAR_BASE_URL);
    url.searchParams.set('q', query);
    const resp = await this.request(url);
    return this.parsePubSearch(resp.body);
  }

  async getPub(id) { // id = userid:pubid  e.g., ynWS968AAAAJ:vDijr-p_gm4C
    const url = new URL('citations', SCHOLAR_BASE_URL);
    url.searchParams.set('view_op', 'view_citation');
    url.searchParams.set('citation_for_view', id);
    const resp = await this.request(url);
    const data = this.parsePub(resp.body);
    data.id = id;
    return data;
  }

  async getPubAuthors(query) {
    const { authors } = await this.searchPub(query);
    return Promise.all(authors.map(async ({ id, url }) => {
      const profile = await this.getAuthorProfile(id);
      return { id, ...profile };
    }));
  }

  parseAuthorSearch($html) {
    const $ = $html;
    const { search } = selectors;
    const $profileContainer = $(search.container);
    const $profile = $($profileContainer.find('.gsc_1usr')[0]);

    const name = $profile.find(search.link).text();
    const link = $profile.find(search.link).attr('href');
    const url = new URL($profile.find(search.link).attr('href'), SCHOLAR_BASE_URL);
    const id = url.searchParams.get('user');

    return { id, name, url: url.href };
  }

  parsePubSearch($html) {
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
    const link = $publicationContainer.find(pub.title).attr('href');

    return { title, authors, link };
  }

  parsePub($html) {
    const $ = $html;
    const { pub } = selectors;
    const $publicationContainer = $('#gsc_vcd_table');

    const title = $('#gsc_vcd_title a').text();
    const link = $('#gsc_vcd_title a').attr('href');
    const authors = $publicationContainer.find('.gs_scl:first-child .gsc_vcd_value').text();
    const date = $publicationContainer.find('.gs_scl:nth-of-type(2) .gsc_vcd_value').text();
    const journal = $publicationContainer.find('.gs_scl:nth-of-type(3) .gsc_vcd_value').text();
    const volume = $publicationContainer.find('.gs_scl:nth-of-type(4) .gsc_vcd_value').text();
    const pages = $publicationContainer.find('.gs_scl:nth-of-type(5) .gsc_vcd_value').text();
    const publisher = $publicationContainer.find('.gs_scl:nth-of-type(6) .gsc_vcd_value').text();
    const description = $publicationContainer.find('.gs_scl:nth-of-type(7) .gsc_vcd_value').text();
    const citations = $publicationContainer.find('.gs_scl:nth-of-type(8) .gsc_vcd_value div:first-child a').text().split(' ').pop();
    const citationslink = $publicationContainer.find('.gs_scl:nth-of-type(8) .gsc_vcd_value div:first-child a').attr('href');

    return { title, link, authors, date, journal, volume, pages, publisher, description, citations, citationslink };
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

    const citations = $(author.citations).first().text();
    const citations5y = $(author.citations5y).text();
    const hindex = $(author.metrics).first().text();
    const hindex5y = $(author.metrics5y).text();
    const i10index = $(author.i10index).first().text();
    const i10index5y = $(author.i10index5y).text();

    return { name, affiliation, homepage, domain, citations, citations5y, hindex, hindex5y, i10index, i10index5y, interests };
  }

  parseAuthorPub($html) {
    const $ = cheerio.load($html);
    const { publications } = selectors;

    const title = $(publications.title).text();
    const link = $(publications.title).attr('data-href');
    const url = new URL(link, SCHOLAR_BASE_URL);
    const id = url.searchParams.get('citation_for_view');
    const authors = $(publications.authors).text();
    const journal = $(publications.journal).first().contents().filter(function() {
      return this.type === 'text';
    }).text();
    const citedby = $(publications.citedby).text();
    const citedbylink = $(publications.citedby).attr('href');
    const year = $(publications.year).text();
    // authors and journal are trimmed with an ellipsis

    return { id, title, link, authors, journal, citedby, citedbylink, year };
  }
}

module.exports = new Scholar();
module.exports.ScholarlyError = ScholarlyError;
module.exports.CaptchaError = CaptchaError;
module.exports.ProxyError = ProxyError;
