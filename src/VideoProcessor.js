import path from 'path';
import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import * as handbrake from 'handbrake-js';
import { VideoFormat } from './VideoFormat.js';
import StringHelper from './helpers/stringHelper.js';

export const ProcessorType = {
  RGB: 'RGB',
  DEPTH: 'DEPTH',
  BOTH: 'RGBD'
};

const RGBProcessor = {
  label: ProcessorType.RGB,
  config: { crop: '0:0:0:1280' }
};

const depthProcessor = {
  label: ProcessorType.DEPTH,
  config: { crop: '0:0:1280:0' }
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

    RGBProcessor.config = { ...handBrakeBaseConfig, ...RGBProcessor.config };
    depthProcessor.config = { ...handBrakeBaseConfig, ...depthProcessor.config };

    const processors = [];

    if (processorType === ProcessorType.BOTH) {
      processors.push(RGBProcessor, depthProcessor);
    } else if (processorType === ProcessorType.DEPTH) {
      processors.push(depthProcessor);
    } else if (processorType === ProcessorType.RGB) {
      processors.push(RGBProcessor);
    }

    for (let i = 0; i < processors.length; ++i) {
      const processor = processors[i];

      const processorLabel =
        processor.label === ProcessorType.DEPTH
          ? StringHelper.capitalizeFirstWord(processor.label)
          : processor.label;

      const parsedOutputPath = path.parse(this.#output);

      let outputFilename = parsedOutputPath.base.split('.')[0];

      if (outputFilename.includes('_RGBD_')) {
        outputFilename = outputFilename.replace(/RGBD/g, processorLabel);
      } else {
        outputFilename = `${outputFilename}_${processorLabel}`;
      }

      const outputPath = path.join(
        parsedOutputPath.dir,
        `${outputFilename}.${VideoFormat.MP4}`
      );

      try {
        await handbrake.run({
          input: this.#input,
          output: outputPath,
          ...processor.config
        });
      } catch (error) {
        throw Error(error);
      }

      options.current = options.current + 1;

      if (!(options.bar === null)) {
        options.bar.update(options.current);
      }
    }

    return options.current;
  }
}
