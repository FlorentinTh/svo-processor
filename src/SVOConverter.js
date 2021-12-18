import os from 'os';
import path from 'path';
import RootPath from 'app-root-path';
import spawn from 'await-spawn';
import { Tags, ConsoleHelper } from './helpers/consoleHelper.js';

class SVOConverter {
  #ZEDExecutablePath;
  #input;
  #output;

  constructor(input, output) {
    const libsFolder = path.join(RootPath.path, 'static', 'bin');

    if (os.platform() === 'win32') {
      this.#ZEDExecutablePath = path.join(libsFolder, 'svo_export.exe');
    } else {
      ConsoleHelper.printMessage(
        Tags.ERROR,
        `SVO conversion is currently supported on Windows only`
      );
      process.exit(1);
    }

    this.#input = input;
    this.#output = output;
  }

  async SVOToAVI() {
    const exportMode = 1;

    try {
      return await spawn(
        this.#ZEDExecutablePath,
        [this.#input, this.#output, exportMode],
        {
          encoding: 'utf-8',
          stdio: ['ignore', 'ignore', process.stderr],
          shell: true
        }
      );
    } catch (error) {
      throw Error(error.stderr.toString());
    }
  }
}

export default SVOConverter;
