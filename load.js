/*
  Given a URL, load the RDF from it
  
  -- what if it's quads?  should rename all the graphs?

  With some hacks which should be plugins I think for special URLs

  BUG: reload doesn't clear it first

  Also includes silly hack for nicer github URLs -- works with normal
  URLs, so you don't need to get over to rawgithubusercontent.com
  yourself.

*/
// const airfetch = require('./fetch-base')
// const rdfize = require('./rdfize')
const fs = require('fs').promises
const LDFetcher = require('ldfetch')
const N3 = require('n3')
const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;
const debug = require('debug')('load')
const path = require('path')

async function load (url, options = {}) {
  debug('loading', url)
  const graphName = namedNode(url)
  const store = this // add func to store, if you like

  // maybe fetcher does this automatically
  if (!options.baseIRI) options.baseIRI = url
  
  const cb = (triple) => {
    triple.graph = graphName
    debug('adding', triple)
    store.addQuad(triple)
  }

  // a filename -- for nq allow it to write all over the store, being trusted
  if (url.indexOf(':') === -1) {
    debug('matched local file')
    let file = url
    const top = path.resolve('static/')
    file = path.resolve(top, file)
    file = path.normalize(file)
    if (file.startsWith(top)) {
      const text = await fs.readFile(file, 'utf8')
      await parseTo(store, text, options)
    } else {
      console.error('evil path rejected', url)
    }
    return
  }
  
  /*
  if (url.match(/^https:\/\/airtable.com\//)) {
    const base = await airfetch(url)
    rdfize(base, cb)
    return
  }
  */
  
  url = rawGitHub(url)
    
  const fetcher = new LDFetcher()
  fetcher.on('request', url => { console.log("HTTP " + url); });
  fetcher.on('response', (url, resp)=> { console.log("OK " + url, resp); });
  fetcher.on('downloaded', obj => { console.log('got', obj) });
  fetcher.on('redirect', obj => {
    console.log('redirect', obj)
    // change base!
  });
  fetcher.on('error', e => { console.log(e) })

  const response = await fetcher.get(url)
  for (let i = 0; i < response.triples.length; i++) {
    let triple = response.triples[i];
    // console.log('triple', triple)
    cb(triple)
  }
}

const ghre = new RegExp('https://github.com/(.*?)/(.*?)/blob/master/(.*)')
function rawGitHub(url) {
  const m = url.match(ghre)
  if (m) {
    const user = m[1]
    const repo = m[2]
    const file = m[3]
    url = `https://raw.githubusercontent.com/${user}/${repo}/master/${file}`
  }
  return url
}

function parseTo (store, text, options = {}) {
  return new Promise((resolve, reject) => {
    const parser = new N3.Parser(options)
    console.log('N3 Parser', options, parser)
    parser.parse(text, (error, quad, prefixes) => {
      if (error) reject(error)
      if (quad) {
        debug('adding quad', quad)
        store.addQuad(quad)
      } else {
        console.log('Our prefixes were', prefixes)
        resolve()
      }
    })
  })
}

module.exports = load
