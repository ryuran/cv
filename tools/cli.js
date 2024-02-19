
import { run } from './run.js';

if (process.argv.length > 2) {
  const module = await import(`./${process.argv[2]}.js`); // eslint-disable-line import/no-dynamic-require
  run(module).catch(err => { console.error(err.stack); process.exit(1); });
}
