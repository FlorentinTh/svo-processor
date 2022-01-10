import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import ProgramHelper from './programHelper.js';
import StringHelper from './stringHelper.js';
import { ProcessorType } from '../VideoProcessor.js';

class CommandHelper {
  #yargs;

  constructor() {
    this.#yargs = yargs(hideBin(process.argv));
  }

  get argv() {
    return this.#yargs
      .usage(
        `Usage:
        $ svo-processor <path> [options]`
      )
      .option('recursive', {
        alias: ['r', 'R'],
        describe: 'Recursively search for SVO files inside the provided path.',
        type: 'boolean',
        demandOption: false,
        default: false
      })
      .option('output', {
        alias: ['o', 'O'],
        describe:
          'Output path. It must be either a file or a folder. If the output is a file, the input also require to be a path and the --convert-only flag must be set.',
        string: true,
        demandOption: false,
        default: false
      })
      .option('process', {
        alias: ['p', 'P'],
        describe: `Process to complete being either 'rgb', 'depth' or 'rgbd'.`,
        string: true,
        demandOption: false,
        default: 'rgbd'
      })
      .option('begin', {
        alias: ['b', 'B'],
        describe: 'Trim a given number of seconds at the beginning.',
        number: true,
        demandOption: false,
        default: 0
      })
      .option('end', {
        alias: ['e', 'E'],
        describe: 'Trim a given number of seconds at the end.',
        number: true,
        demandOption: false,
        default: 0
      })
      .option('convert-only', {
        describe:
          'Only convert SVO files into AVI format. The file processing is skipped.',
        type: 'boolean',
        demandOption: false,
        default: false
      })
      .option('avi', {
        describe:
          'Search for existing AVI files to process instead of SVO by default when input is a directory. The conversion is skipped.',
        type: 'boolean',
        demandOption: false,
        default: false
      })
      .help('h')
      .alias('h', ['H', 'help'])
      .version(ProgramHelper.getPackageJson().version)
      .alias('v', ['V', 'version']).argv;
  }

  #searchOption(option) {
    if (process.argv.indexOf(option) > -1) {
      return true;
    }
    return false;
  }

  isOptionSet(option) {
    if (this.#searchOption(`-${option}`) || this.#searchOption(`--${option}`)) {
      return true;
    }

    const aliases = this.#yargs.choices(option).parsed.aliases[option];

    for (const aliasIndex in aliases) {
      const alias = aliases[aliasIndex];
      if (this.#searchOption(`-${alias}`) || this.#searchOption(`--${alias}`)) {
        return true;
      }
    }
    return false;
  }

  async validateOptions() {
    const argv = this.argv;

    if (argv._.length > 1) {
      return { error: true, message: `Unexpected parameter: ${argv._[1]}` };
    }

    const inputPath = argv._[0];

    if (!StringHelper.isString(inputPath)) {
      return { error: true, message: 'Input path must be a valid string' };
    }

    try {
      await fs.promises.access(inputPath);
    } catch (error) {
      return { error: true, message: 'Cannot access to the provided input path' };
    }

    if (this.isOptionSet('output')) {
      const outputPath = argv.output;

      if (!StringHelper.isString(outputPath)) {
        return { error: true, message: 'Output path must be a valid string' };
      }
    }

    if (this.isOptionSet('begin')) {
      const beginValue = argv.begin;

      if (!Number.isFinite(beginValue) && !(beginValue > 0)) {
        return {
          error: true,
          message: 'Begin option must be an actual number greater than 0'
        };
      }
    }

    if (this.isOptionSet('end')) {
      const endValue = argv.end;

      if (!Number.isFinite(endValue) && !(endValue > 0)) {
        return {
          error: true,
          message: 'End option must be an actual number greater than 0'
        };
      }
    }

    if (this.isOptionSet('process')) {
      if (!Object.values(ProcessorType).includes(argv.process.toUpperCase())) {
        return {
          error: true,
          message: `Process options must either be set to ${ProcessorType.RGB.toLowerCase()}, ${ProcessorType.DEPTH.toLowerCase()} or ${ProcessorType.BOTH.toLowerCase()}`
        };
      }
    }

    return { error: false, message: 'OK' };
  }
}

export default CommandHelper;
