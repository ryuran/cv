import { run } from './run.js';

import { globSync } from 'glob';
import path from 'path';
import fs from 'fs-extra';

import njk from 'nunjucks';
import nunjucksDate from 'nunjucks-date-filter';

import * as sass from 'sass';

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

// Clean
async function clean() {
  return fs.remove(dist);
}

// css
async function css() {
  const scssFiles= globSync('./src/scss/*.scss');

  const postProcessor = postcss([
    autoprefixer({
      grid: true,
    }),
    cssnano
  ]);

  scssFiles.forEach((file)  =>{
    const entry = path.relative('./src/scss', file);
    const dest = path.join(dist, 'css', entry.replace('.scss', '.css'));

    const result = sass.compile(file);

    postProcessor.process(result.css, { from: entry, to: dest })
      .then(result => {
          newFile(dest, result.css);
          if (result.map) {
            newFile(dest + '.map', result.map);
          }
      });
  });
}

async function assets() {
  return fs.copy('./src/assets', path.join(dist, 'assets'));
}

// html
async function html() {
  const indexTpl = 'index.njk';
  const { default: indexData } = await import('../src/data/index.json', {
    assert: { type: 'json' }
  });
  const dest = path.join(dist, indexTpl.replace('.njk', '.html'));

  newFile(dest, njkEnv.render(indexTpl, indexData));
}

async function build() {
  await run(clean);
  await run(css);
  await run(assets);
  await run(html);
}

export default build;
