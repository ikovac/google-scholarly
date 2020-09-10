'use strict';

const cheerio = require('cheerio');
const got = require('got');
const PROXY_URL = 'http://api.proxiesapi.com';
const SCHOLAR_BASE_URL = 'https://scholar.google.com';

const searchTags = {
  pub: {
    result: '.gs_r.gs_or.gs_scl .gs_ri',
    title: 'h3 a',
    authors: '.gs_a a'
  },
  authorProfile: {
    result: '#gsc_bdy',
    name: '.gsc_lcl #gsc_prf_in',
    domain: '.gsc_lcl #gsc_prf_ivh',
    affiliation: '.gsc_lcl .gsc_prf_il',
    interests: '.gsc_lcl #gsc_prf_int a',
    metrics: '.gsc_rsb #gsc_rsb_st tbody tr'
  }
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
      if (error.response.statusCode === 401) {
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
      if (error.response.statusCode === 401) {
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
    return await Promise.all(authors.map(async ({ url }) => await this.getAuthorProfile(url)));
  }

  parsePub(html) {
    const { pub } = searchTags;
    const $ = cheerio.load(html);
    const $result = $(pub.result).first().html();
    const $authors = $(pub.authors, $result);

    const authors = [];
    $($authors).each((_, $element) => {
      const name = $($element).text();
      const url = $($element).attr('href');
      authors.push({ name, url });
    });
    const title = $(pub.title, $result).text();
    return { title, authors };
  }

  parseAuthorProfile(html) {
    const { authorProfile } = searchTags;
    const $ = cheerio.load(html);
    const $result = $(authorProfile.result);

    const name = $(authorProfile.name, $result).text();
    const affiliation = $(authorProfile.affiliation, $result).first().text();
    const homepage = $(`${authorProfile.domain} a`, $result).attr('href');
    const $domainText = $(authorProfile.domain, $result).text();
    const domain = $domainText.slice(0, $domainText.indexOf(' -')).split(' ').pop();

    // Interests
    const interests = [];
    $(authorProfile.interests, $result).each((_, $element) => {
      const interest = $($element).text();
      interests.push(interest);
    });

    // hindex
    const $tr = $(authorProfile.metrics, $result).get(1);
    const hindex = $('.gsc_rsb_std', $tr).first().text();

    return { name, affiliation, homepage, domain, hindex, interests };
  }
}

module.exports = new Scholar();
