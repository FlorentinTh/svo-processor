import fs from 'fs';
import path from 'path';
import readdirp from 'readdirp';
import cliProgress from 'cli-progress';
import { fileTypeFromStream } from 'file-type';
import { VideoFormat } from './VideoFormat.js';
import SVOConverter from './SVOConverter.js';
import { ProcessorType, VideoProcessor } from './VideoProcessor.js';
import CommandHelper from './helpers/commandHelper.js';
import { Tags, ConsoleHelper } from './helpers/consoleHelper.js';

class SVOProcessor {
  #argv;

  #progressBar;
  #maxProgressValue;
  #currentProgressValue;

  #isInfosPrinted;

  get progressBar() {
    return this.#progressBar;
  }

  set argv(argv) {
    this.#argv = argv;
  }

  constructor() {
    this.#initProgressBar();
    this.#isInfosPrinted = false;
  }

  #initProgressBar() {
    this.#progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    this.#maxProgressValue = 0;
    this.#currentProgressValue = 0;
  }

  async #getFiles(path, filter, options = { recursive: false }) {
    let conf = {
      fileFilter: `*.${filter}`,
      alwaysStat: true
    };

    if (!options.recursive) {
      conf.depth = 0;
    }

    return await readdirp.promise(path, conf);
  }

  async #createFoldersIfNotExist(path) {
    try {
      await fs.promises.access(path);
    } catch (error) {
      if (error.code === 'ENOENT') {
        try {
          await fs.promises.mkdir(path, { recursive: true });
        } catch (error) {
          throw Error(error);
        }
      }
    }
  }

  #setMaxProgressValue(nbInputFiles) {
    if (!Number.isFinite(nbInputFiles) && nbInputFiles <= 0) {
      ConsoleHelper.printMessage(
        `The parameter: nbInputFiles must be a finite number greater than 0. Received: ${nbInputFiles}`
      );
      process.exit(1);
    }

    if (!this.#argv.convertOnly && !this.#argv.trimOnly) {
      if (this.#argv.process.toUpperCase() === ProcessorType.BOTH) {
        this.#maxProgressValue += nbInputFiles * 2;
      } else {
        this.#maxProgressValue += nbInputFiles;
      }

      if (!this.#argv.avi) {
        this.#maxProgressValue += nbInputFiles;
      }
    } else {
      this.#maxProgressValue = nbInputFiles;
    }
  }

  #showStartInfos() {
    ConsoleHelper.printMessage(Tags.INFO, `Start processing files : `);
    this.#progressBar.start(this.#maxProgressValue, this.#currentProgressValue);
    this.#isInfosPrinted = true;
  }

  async #startProcess(files, videoFormat, isFolder) {
    if (!(files.length > 0)) {
      ConsoleHelper.printMessage(
        Tags.ERROR,
        `No ${videoFormat.toUpperCase()} files found`
      );
      process.exit(1);
    }

    if (!isFolder && this.#argv.recursive) {
      ConsoleHelper.printMessage(
        Tags.WARN,
        `Ignoring recursive option since the input is not a folder`
      );
    }

    for (const file of files) {
      let AVIFileName;
      let AVIFilePath;

      let MP4FileName;
      let MP4FilePath;

      let processConfig = {
        start: this.#argv.begin,
        stop: this.#argv.end
      };

      if (this.#argv.output) {
        if (!(path.parse(this.#argv.output).ext === '')) {
          if (!isFolder) {
            if (!this.#argv.convertOnly) {
              ConsoleHelper.printMessage(
                Tags.ERROR,
                `Output path can be a file only for conversion. Consider using the --convert-only flag`
              );
              process.exit(1);
            } else {
              try {
                await this.#createFoldersIfNotExist(path.parse(this.#argv.output).dir);
              } catch (error) {
                ConsoleHelper.printMessage(
                  Tags.ERROR,
                  `Error occurs while trying to create required folder provided in output path`,
                  error
                );
              }
            }
          } else {
            ConsoleHelper.printMessage(
              Tags.ERROR,
              `Output path cannot be a file since input is a folder`
            );
            process.exit(1);
          }
        } else {
          try {
            await this.#createFoldersIfNotExist(this.#argv.output);
          } catch (error) {
            ConsoleHelper.printMessage(
              Tags.ERROR,
              `Error occurs while trying to create required folder provided in output path`,
              error
            );
          }
        }
      }

      if (!this.#isInfosPrinted) {
        this.#setMaxProgressValue(files.length);
      }

      if (videoFormat === VideoFormat.SVO) {
        AVIFileName = `${file.basename.split('.')[0]}.${VideoFormat.AVI}`;

        if (this.#argv.output) {
          if (!(path.parse(this.#argv.output).ext === '')) {
            const outputParsed = path.parse(this.#argv.output);
            AVIFileName = outputParsed.base;
            AVIFilePath = path.join(outputParsed.dir, AVIFileName);
          } else {
            AVIFilePath = path.join(this.#argv.output, AVIFileName);
          }
        } else {
          const parsedFilePath = path.parse(file.fullPath);

          AVIFilePath = path.join(
            parsedFilePath.dir,
            `${parsedFilePath.name}.${VideoFormat.AVI}`
          );
        }

        const converter = new SVOConverter(file.fullPath, AVIFilePath);

        if (!this.#isInfosPrinted) {
          this.#showStartInfos();
        }

        try {
          await converter.SVOToAVI();
        } catch (error) {
          ConsoleHelper.printMessage(
            Tags.ERROR,
            `Error occurs while converting ${file.basename}`,
            error
          );
          process.exit(1);
        }

        this.#currentProgressValue += 1;
        this.#progressBar.update(this.#currentProgressValue);
      } else if (videoFormat === VideoFormat.AVI) {
        AVIFileName = file.basename;
        AVIFilePath = file.fullPath;

        const stream = fs.createReadStream(AVIFilePath);
        const fileType = await fileTypeFromStream(stream);

        if (fileType === undefined || !(fileType.mime === 'video/vnd.avi')) {
          ConsoleHelper.printMessage(
            Tags.ERROR,
            `The file: ${AVIFileName} is not a proper AVI file. It might be corrupted in some ways`
          );
          process.exit(1);
        }

        if (this.#argv.output) {
          processConfig = {
            ...processConfig,
            output: path.join(this.#argv.output, AVIFileName)
          };
        }

        if (!this.#isInfosPrinted) {
          this.#showStartInfos();
        }
      } else if (videoFormat === VideoFormat.MP4) {
        MP4FileName = file.basename;
        MP4FilePath = file.fullPath;

        const stream = fs.createReadStream(MP4FilePath);
        const fileType = await fileTypeFromStream(stream);

        if (fileType === undefined || !(fileType.mime === 'video/mp4')) {
          ConsoleHelper.printMessage(
            Tags.ERROR,
            `The file: ${MP4FileName} is not a proper MP4 file. It might be corrupted in some ways`
          );
          process.exit(1);
        }

        if (!this.#isInfosPrinted) {
          this.#showStartInfos();
        }
      }

      if (!this.#argv.convertOnly) {
        let filePath;
        let currentProcess;

        if (AVIFilePath === undefined && !(MP4FilePath === undefined)) {
          filePath = MP4FilePath;
          currentProcess = ProcessorType.TRIM;
        } else if (MP4FilePath === undefined && !(AVIFilePath === undefined)) {
          filePath = AVIFilePath;
          currentProcess = this.#argv.process.toUpperCase();
        } else {
          ConsoleHelper.printMessage(
            Tags.ERROR,
            `Cannot process input, the path does not exists.`
          );
          process.exit(1);
        }

        const videoProcessor = new VideoProcessor(filePath, processConfig);

        let transformed;
        try {
          transformed = await videoProcessor.transform(currentProcess, {
            current: this.#currentProgressValue,
            bar: this.#progressBar
          });
        } catch (error) {
          ConsoleHelper.printMessage(
            Tags.ERROR,
            `Error occurs while processing ${filePath}`,
            error
          );
          process.exit(1);
        }

        this.#currentProgressValue = transformed.current;
      }
    }
  }

  async run() {
    const commandHelper = new CommandHelper();
    this.argv = commandHelper.argv;

    const validation = await commandHelper.validateOptions();

    if (!validation.error) {
      const argvPath = this.#argv._[0];

      let pathStats = null;

      try {
        pathStats = await fs.promises.lstat(argvPath);
      } catch (error) {
        ConsoleHelper.printMessage(Tags.ERROR, `${error}`);
        process.exit(1);
      }

      let videoFormat;
      if (this.#argv.avi) {
        videoFormat = VideoFormat.AVI;
      } else {
        if (this.#argv.trimOnly) {
          videoFormat = VideoFormat.MP4;
        } else {
          videoFormat = VideoFormat.SVO;
        }
      }

      if (pathStats.isDirectory()) {
        if (videoFormat === VideoFormat.MP4) {
          ConsoleHelper.printMessage(Tags.ERROR, `Input path cannot be a directory`);
          process.exit(1);
        }

        const files = await this.#getFiles(argvPath, videoFormat, {
          recursive: this.#argv.recursive
        });

        if (!(files.length > 0)) {
          ConsoleHelper.printMessage(
            Tags.ERROR,
            `No ${videoFormat.toUpperCase()} files found`
          );
          process.exit(1);
        }

        await this.#startProcess(files, videoFormat, true);
      } else if (pathStats.isFile()) {
        const files = [];

        files.push({
          fullPath: argvPath,
          basename: path.parse(argvPath).base,
          stats: pathStats
        });

        await this.#startProcess(files, videoFormat, false);
      }
    } else {
      ConsoleHelper.printMessage(Tags.ERROR, validation.message);
      process.exit(1);
    }

    this.#progressBar.stop();
    ConsoleHelper.printMessage(Tags.OK, `Process successfully completed`);
  }
}

export default SVOProcessor;
