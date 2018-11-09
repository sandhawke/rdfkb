const N3 = require('n3')
const load = require('./load')
const namespace = require('@rdfjs/namespace')

const { DataFactory } = N3;
const { namedNode, literal, defaultGraph, quad } = DataFactory;

// console.log(namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'))
  
const api = {}
module.exports = api

api.DefaultGraph = defaultGraph()

api.defaultns = {
  rdf:  'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl:  'http://www.w3.org/2002/07/owl#',
  xs:   'http://www.w3.org/2001/XMLSchema#',
  xsd:  'http://www.w3.org/2001/XMLSchema#',
  foaf: 'http://xmlns.com/foaf/0.1/',
  dc:   'http://purl.org/dc/elements/1.1/',
  dct:  'http://purl.org/dc/terms/'
}

api.create = (options = {}) =>  {
  const store = N3.Store()
  store.aload = load   // call it aload to remind myself to await it
  // (which seems silly, but I keep forgetting.)
  store.dump = dump

  store.namedNode = namedNode
  store.named = namedNode
  store.lit = literal
  store.literal = literal
  store.def = defaultGraph
  store.defaultGraph = defaultGraph
  store.quad = quad
  store.prefixes = Object.assign({}, api.defaultns, options.prefixes || {})
  store.ns = nsfunc
  for (const [prefix, suffix] of Object.entries(store.prefixes)) {
    store.ns(prefix, suffix)
  }
  
  return store

  function nsfunc(prefix, suffix) {
    if (!prefix) prefix = ''
    store.ns[prefix] = namespace(suffix, { factory: DataFactory})
    // Or should I make it store[prefix] ?!!   HHRRRRRRM.
  }

  /*
  function nsfunc(prefix, suffix) {
    if (!prefix) prefix = ''
    const id = namedNode(prefixes[prefix] + suffix)
    if (prefix === '') {
      store.ns[suffix] = id
      // console.log('ns[suffix] now', store.ns[suffix])
    } else {
      if (!store.ns[prefix]) {
        store.ns[prefix] = {}
      }
      store.ns[prefix][suffix] = id
    }
    return id
  }
  */
  
  function dump() {
  const writer = N3.Writer(process.stdout,
                           { end: false,
                             prefixes:
                             { '': 'https://example.org#' } })
  store.forEach(q => writer.addQuad(q))
  writer.end()
}


}

// find prefixes programmatically???




