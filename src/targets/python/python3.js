/**
 * @description
 * HTTP code snippet generator for native Python3.
 *
 * @author
 * @montanaflynn
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */

'use strict'

const CodeBuilder = require('../../helpers/code-builder')
const helpers = require('../../helpers/headers')

module.exports = function (source, options) {
  const code = new CodeBuilder()

  // Start Request
  code.push('import http.client')

  if (options.insecureSkipVerify) {
    code.push('import ssl')
  }

  const mayBeGzipped = helpers.hasHeader(source.allHeaders, 'accept-encoding') &&
    helpers.getHeader(source.allHeaders, 'accept-encoding').includes('gzip')

  if (mayBeGzipped) {
    code.push('import gzip')
  }

  code.blank()

  // Check which protocol to be used for the client connection
  const protocol = source.uriObj.protocol
  if (protocol === 'https:') {
    if (options.insecureSkipVerify) {
      code.push(
        'conn = http.client.HTTPSConnection("%s", context = ssl._create_unverified_context())',
        source.uriObj.host
      ).blank()
    } else {
      code.push('conn = http.client.HTTPSConnection("%s")', source.uriObj.host)
        .blank()
    }
  } else {
    code.push('conn = http.client.HTTPConnection("%s")', source.uriObj.host)
      .blank()
  }

  // Create payload string if it exists
  const payload = JSON.stringify(source.postData.text)
  if (payload) {
    code.push('payload = %s', payload)
      .blank()
  }

  // Create Headers
  const headers = source.allHeaders
  const headerCount = Object.keys(headers).length
  if (headerCount === 1) {
    for (const header in headers) {
      code.push('headers = { "%s": "%qd" }', header, headers[header])
        .blank()
    }
  } else if (headerCount > 1) {
    let count = 1

    code.push('headers = {')

    for (const header in headers) {
      if (count++ !== headerCount) {
        code.push('    "%s": "%qd",', header, headers[header])
      } else {
        code.push('    "%s": "%qd"', header, headers[header])
      }
    }

    code.push('}')
      .blank()
  }

  // Make Request
  const method = source.method
  const path = source.uriObj.path
  if (payload && headerCount) {
    code.push('conn.request("%s", "%s", payload, headers)', method, path)
  } else if (payload && !headerCount) {
    code.push('conn.request("%s", "%s", payload)', method, path)
  } else if (!payload && headerCount) {
    code.push('conn.request("%s", "%s", headers=headers)', method, path)
  } else {
    code.push('conn.request("%s", "%s")', method, path)
  }

  // Get Response
  code.blank()
    .push('res = conn.getresponse()')
    .push('data = res.read()')
    .blank()

  // Decode response
  if (mayBeGzipped) {
    code.push("if res.headers['content-encoding'] == 'gzip':")
    code.push('    print(gzip.decompress(data).decode("utf-8"))')
    code.push('else:')
    code.push('    print(data.decode("utf-8"))')
  } else {
    code.push('print(data.decode("utf-8"))')
  }

  return code.join()
}

module.exports.info = {
  key: 'python3',
  title: 'http.client',
  link: 'https://docs.python.org/3/library/http.client.html',
  description: 'Python3 HTTP Client'
}
