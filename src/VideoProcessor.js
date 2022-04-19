import path from 'path';
import fs from 'fs';
import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import * as handbrake from 'handbrake-js';
import { VideoFormat } from './VideoFormat.js';
import StringHelper from './helpers/stringHelper.js';
import { ConsoleHelper, Tags } from './helpers/consoleHelper.js';

export const ProcessorType = {
  RGB: 'RGB',
  DEPTH: 'DEPTH',
  BOTH: 'RGBD',
  TRIM: 'TRIM'
};

const RGBProcessor = {
  label: ProcessorType.RGB,
  config: { crop: '0:0:0:1280' }
};

const depthProcessor = {
  label: ProcessorType.DEPTH,
  config: { crop: '0:0:1280:0' }
};

const trimProcessor = {
  label: ProcessorType.TRIM,
  config: {}
};

export class VideoProcessor {
  #input;
  #output;
  #start;
  #stop;

  constructor(input, options = { output: null, start: 0, stop: 0 }) {
    this.#input = input;
    this.#output =
      options.output === null || options.output === undefined ? input : options.output;
    this.#start = options.start;
    this.#stop = options.stop;
  }

  async transform(processorType, options = { current: 0, bar: null }) {
    let metadata;

    try {
      metadata = await ffprobe(this.#input, { path: ffprobeStatic.path });
    } catch (error) {
      throw Error(error);
    }

    const duration = Math.round(metadata.streams[0].duration);

    const handBrakeBaseConfig = {
      'start-at': `seconds:${this.#start}`,
      'stop-at': `seconds:${duration - (this.#start + this.#stop)}`
    };

    const processors = [];

    if (processorType === ProcessorType.BOTH) {
      RGBProcessor.config = { ...handBrakeBaseConfig, ...RGBProcessor.config };
      depthProcessor.config = { ...handBrakeBaseConfig, ...depthProcessor.config };
      processors.push(RGBProcessor, depthProcessor);
    } else if (processorType === ProcessorType.DEPTH) {
      depthProcessor.config = { ...handBrakeBaseConfig, ...depthProcessor.config };
      processors.push(depthProcessor);
    } else if (processorType === ProcessorType.RGB) {
      RGBProcessor.config = { ...handBrakeBaseConfig, ...RGBProcessor.config };
      processors.push(RGBProcessor);
    } else if (processorType === ProcessorType.TRIM) {
      trimProcessor.config = { ...handBrakeBaseConfig, ...trimProcessor.config };
      processors.push(trimProcessor);

      const inputParsedPath = path.parse(this.#input);
      const renamedInput = path.join(inputParsedPath.dir, `tmp_${inputParsedPath.base}`);

      try {
        await fs.promises.rename(this.#input, renamedInput);
      } catch (error) {
        ConsoleHelper.printMessage(
          Tags.ERROR,
          `Renaming file: ${this.#input} into ${renamedInput} failed.`
        );
        process.exit(1);
      }

      this.#input = renamedInput;
    }

    for (let i = 0; i < processors.length; ++i) {
      const processor = processors[i];

      let outputPath;

      const parsedOutputPath = path.parse(this.#output);
      let outputFilename = parsedOutputPath.base.split('.')[0];

      if (!(processor.label === ProcessorType.TRIM)) {
        const processorLabel =
          processor.label === ProcessorType.DEPTH
            ? StringHelper.capitalizeFirstWord(processor.label)
            : processor.label;

        if (outputFilename.includes('_RGBD_')) {
          outputFilename = outputFilename.replace(/RGBD/g, processorLabel);
        } else {
          outputFilename = `${outputFilename}_${processorLabel}`;
        }

        outputPath = path.join(
          parsedOutputPath.dir,
          `${outputFilename}.${VideoFormat.MP4}`
        );
      } else {
        outputPath = path.join(
          parsedOutputPath.dir,
          `${outputFilename}.${VideoFormat.MP4}`
        );
      }

      try {
        await handbrake.run({
          input: this.#input,
          output: outputPath,
          ...processor.config
        });
      } catch (error) {
        throw Error(error);
      }

      if (processorType === ProcessorType.TRIM) {
        try {
          await fs.promises.unlink(this.#input);
        } catch (error) {
          ConsoleHelper.printMessage(Tags.ERROR, `Removing file: ${this.#input} failed.`);
          process.exit(1);
        }
      }

      options.current = options.current + 1;

      if (!(options.bar === null)) {
        options.bar.update(options.current);
      }
    }

    return {
      current: options.current
    };
  }
}
