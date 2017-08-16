/*jslint node: true */
/*jslint esversion: 6 */
import run from './run';

import glob from 'glob';
import path from 'path';
import fs from 'fs-extra';

import njk from 'nunjucks';
import nunjucksDate from 'nunjucks-date-filter';

import sass from 'node-sass';
import sassImporter from 'node-sass-import';

import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

const njkEnv = new njk.Environment([new njk.FileSystemLoader('./src/njk')]);
njkEnv.addFilter('date', nunjucksDate);

// utils
function newFile(dest, content) {
  fs.ensureFile(dest, function (err) {
    if(err) {
      return console.log(err);
    }

    fs.writeFile(dest, content, function(err) {
      if(err) {
        return console.log(err);
      }

      console.log(dest + ' was saved!');
    });
  });
}

const dist = './dist/';
const temp = './.tmp/';

// Clean
async function clean() {
  fs.removeSync(dist);
}

// css
async function css() {
  const scssFiles= glob.sync('./src/scss/*.scss');

  const postProcessor = postcss([
    autoprefixer({
      grid: true,
      browsers: ['> 1%']
    }),
    cssnano
  ]);

  scssFiles.forEach(function (file, index) {
    const entry = path.relative('./src/scss', file);
    const dest = path.join(dist, 'css', entry.replace('.scss', '.css'));

    sass.render({
      file: file,
      importer: sassImporter
    }, function(err, result) {
      if(err) {
        return console.log(err);
      }

      // post css
      postProcessor.process(result.css, { from: entry, to: dest })
      .then(result => {
          newFile(dest, result.css);
          if (result.map) {
            newFile(dest + '.map', result.map);
          }
      });
    });
  });
}

async function assets() {
  fs.copy('./src/assets', dist);
}

// html
async function html() {
  var indexTpl = 'index.njk';
  var indexData = require('../src/data/index.json');
  var dest = indexTpl.replace('.njk', '.html');
  dest = path.join(dist, dest);

  newFile(dest, njkEnv.render(indexTpl, indexData));
}

async function build() {
  await run(clean);
  await run(css);
  await run(assets);
  await run(html);
}

export default build;
