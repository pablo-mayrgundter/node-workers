#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const Piscina = require('piscina')


const startTime = Date.now()
function log(...msgs) {
  const curTime = Date.now()
  console.error((curTime - startTime) / 1000 + 's', ...msgs)
}


log('start')
// first args are node and name of file.
const args = process.argv.slice(2)
if (args.length == 0) {
  throw new Error('Missing path argument')
}

const inputFilename = args[0]
fs.promises.open(inputFilename, 'r').then((fd) => {
  fd.stat().then(async (fileStats) => {
    if (!fileStats.isFile()) {
      console.error('Input must be a file')
      return
    }
    const numWorkers = 2
    const readBufs = new Array(numWorkers)
    const bufSize = Math.floor(fileStats.size / numWorkers)
    for (let i = 0; i < readBufs.length - 1; i++) {
      readBufs[i] = new Uint8Array(bufSize)
    }
    const lastBufSize = fileStats.size - (bufSize * (numWorkers - 1))
    readBufs[readBufs.length - 1] = new Uint8Array(lastBufSize)
    let bufTotal = readBufs.reduce((prev, cur) => prev + cur.length, 0)
    log('bufTotal:', bufTotal)
    fd.readv(readBufs).then(async (result, buffers) => {
      if (result.bytesRead < readBufs.length * bufSize) {
        throw new Error('Incomplete read: ' + result.bytesRead)
      }
      const pool = new Piscina({filename: './worker.js'})
      log('after pool create')
      const ifcJson = {}
      const results = await Promise.all(readBufs.map((buf) => pool.run({
        buf,
        ifcJson
      })))
      log('after workers')
      /*
      for (let i = 0; i < results.length; i++) {
        const eltArr = results[i]
        eltArr.reduce((prev, cur) => {
          ifcJson[cur.elementId] = cur
        }, ifcJson)
        // console.log(JSON.stringify(results[i], null, ''))
      }*/
      log('after reduce', ifcJson)
      for (const [key, value] of Object.entries(ifcJson)) {
        console.log(key, value)
      }
      log('done')
    })
  })
})
