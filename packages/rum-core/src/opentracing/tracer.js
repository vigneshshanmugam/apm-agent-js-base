/**
 * MIT License
 *
 * Copyright (c) 2017-present, Elasticsearch BV
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

const { Tracer: otTracer } = require('opentracing/lib/tracer')
const {
  REFERENCE_CHILD_OF,
  FORMAT_TEXT_MAP,
  FORMAT_HTTP_HEADERS,
  FORMAT_BINARY
} = require('opentracing/lib/constants')
const { Span: NoopSpan } = require('opentracing/lib/span')

const { getTimeOrigin, find } = require('../common/utils')
const Span = require('./span')

class Tracer extends otTracer {
  constructor(performance, transaction, logger) {
    super()
    this.performance = performance
    this.transaction = transaction
    this.logger = logger
  }

  _startSpan(name, options) {
    const spanOptions = {}
    if (options) {
      spanOptions.timestamp = options.startTime
      if (options.childOf) {
        spanOptions.parentId = options.childOf.id
      } else if (options.references && options.references.length > 0) {
        if (options.references.length > 1) {
          this.logger.debug(
            // eslint-disable-next-line
            'Elastic APM OpenTracing: Unsupported number of references, only the first childOf reference will be recorded.'
          )
        }

        const childRef = find(options.references, function(ref) {
          return ref.type() === REFERENCE_CHILD_OF
        })
        if (childRef) {
          spanOptions.parentId = childRef.referencedContext().id
        }
      }
    }

    const currentTransaction = this.transaction.getCurrentTransaction()
    let span

    if (currentTransaction && !currentTransaction.ended) {
      span = this.transaction.startSpan(name, undefined, spanOptions)
    } else {
      span = this.transaction.startTransaction(name, undefined, spanOptions)
    }

    if (!span) {
      return new NoopSpan()
    }

    if (spanOptions.timestamp) {
      span._start = spanOptions.timestamp - getTimeOrigin()
    }
    const otSpan = new Span(this, span)
    if (options && options.tags) {
      otSpan.addTags(options.tags)
    }
    return otSpan
  }

  _inject(spanContext, format, carrier) {
    switch (format) {
      case FORMAT_TEXT_MAP:
      case FORMAT_HTTP_HEADERS:
        this.performance.injectDtHeader(spanContext, carrier)
        break
      case FORMAT_BINARY:
        this.logger.debug(
          'Elastic APM OpenTracing: binary carrier format is not supported.'
        )
        break
    }
  }

  _extract(format, carrier) {
    let ctx
    switch (format) {
      case FORMAT_TEXT_MAP:
      case FORMAT_HTTP_HEADERS:
        ctx = this.performance.extractDtHeader(carrier)
        break
      case FORMAT_BINARY:
        this.logger.debug(
          'Elastic APM OpenTracing: binary carrier format is not supported.'
        )
        break
    }

    if (!ctx) {
      ctx = null
    }
    return ctx
  }
}

module.exports = Tracer
