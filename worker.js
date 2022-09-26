const {parentPort} = require('worker_threads')


module.exports = async function(work) {
  if (work.buf) {
    return onBuf(work.buf, work.ifcJson)
  } else {
    throw new Error('Unknown work type: ', work)
  }
}


function onBuf(byteBuf, ifcJson) {
  const dec = new TextDecoder('utf-8')
  const buf = dec.decode(byteBuf)
  console.log('worker.js#onBuf, input:', buf)
  const lineRegex = new RegExp(/#(\d+)= (\w+)\((.+)\);/mg)
  const results = []
  while (result = lineRegex.exec(buf)) {
    const eltId = result[1]
    ifcJson[eltId] = {type: result[2], args: result[3]}
    console.log('worker.js#onBuf, result:', ifcJson)
    // results.push(json)
  }
  return results
}
