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

import { join } from 'path'
import resolve from 'rollup-plugin-node-resolve'
// import { uglify } from 'rollup-plugin-uglify'
import { terser } from 'rollup-plugin-terser'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'

const OUTPUT_DIR = join(__dirname, 'dist', 'rollup')
const SRC_DIR = join(__dirname, 'src')

export default {
  input: {
    'elastic-apm-rum': join(SRC_DIR, 'index.js')
  },
  output: {
    dir: OUTPUT_DIR,
    name: '[name].umd.min.js',
    format: 'umd',
    exports: 'named',
    sourcemap: true,
    esModule: false
  },
  plugins: [
    resolve({
      mainFields: ['module', 'main'],
      browser: true
    }),
    commonjs({
      include: /\/node_modules\//,
      namedExports: {
        'es6-promise': ['polyfill']
      }
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    babel(),
    terser({
      sourcemap: true,
      ecma: '5'
    })
  ]
}