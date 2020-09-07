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
    domain: '.gsc_lcl gsc_prf_il',
    affiliation: '.gsc_lcl .gsc_prf_il',
    interests: '.gsc_lcl .gsc_prf_il',
    metrics: '.gsc_rsb #gsc_rsb_st'
  }
};

class Scholar {
  constructor() { }

  init(key) {
    this.apiKey = key;
    // this.baseUrl = `${PROXY_URL}?auth_key=${this.apiKey}&url=`;
    this.baseUrl = ``;
  }

  request(url) {
    // const searchUrl = `${this.baseUrl}${encodeURIComponent(url)}`;
    const searchUrl = `${this.baseUrl}${url}`;
    return got(searchUrl);
  }

  async searchPub(query) {
    const url = `${SCHOLAR_BASE_URL}/scholar?q=` + encodeURIComponent(query);
    try {
      const result = await this.request(url)
      return this.parsePub(result.body);
    } catch (error) {
      if (error.response.statusCode === 401) {
        throw new Error('Api key invalid or expired');
      }
      throw new Error(error);
    }
  }

  async getAuthorProfile(link) {
    const url = SCHOLAR_BASE_URL + link;
    try {
      const result = await this.request(url)
      return this.parsePub(result.body);
    } catch (error) {
      if (error.response.statusCode === 401) {
        throw new Error('Api key invalid or expired');
      }
      throw new Error(error);
    }
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
    const title = $(pub.title , $result).text();
    return { title, authors };
  }

  parseAuthorProfile(html) {
    const $ = cheerio.load(html);
  }

  // parseResult(html) {
  //   const $ = cheerio.load(html);
  //   const results = $(searchTags.results);

  //   if (!results.length) {
  //     return null;
  //   }

  //   const authors = [];
  //   $(results).each((index, element) => {
  //     const author = {};

  //     author.name = $(searchTags.name, element).text();
  //     author.domain = $(searchTags.email, element).text().split(' ').pop();
  //     author.affiliation = $(searchTags.affiliation, element).text();

  //     const interestsHtml = $(searchTags.interests, element);
  //     const interests = [];
  //     $(interestsHtml).each((_, element) => {
  //       interests.push($(element).text());
  //     });
  //     author.interests = interests;

  //     authors.push(author);
  //   });

  //   return authors;
  // }

  // async getAuthor(query) {
  //   const url = `${SCHOLAR_BASE_URL}/citations?hl=en&view_op=search_authors&mauthors=` + encodeURIComponent(query);

  //   let result;
  //   try {
  //     result = await this.request(url)
  //     return this.parseResult(result.body);
  //   } catch (error) {
  //     if (error.response.statusCode === 401) {
  //       throw new Error('Api key invalid or expired');
  //     }
  //     throw new Error(error);
  //   }
  // }
}

module.exports = new Scholar();
