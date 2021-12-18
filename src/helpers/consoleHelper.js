import chalk from 'chalk';

export const Tags = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  OK: 'OK',
  WARN: 'WARN'
};

export class ConsoleHelper {
  static printMessage(tag, message, error = null) {
    if (!(Object.prototype.toString.call(message) === '[object String]')) {
      this(Tags.ERROR, `Error message must be a string`);
      process.exit(1);
    }

    let errorMsg = '';

    if (!(error === null)) {
      errorMsg = `. Reason: ${error}`;
    }

    switch (tag) {
      case Tags.INFO:
        tag = chalk.cyan(tag);
        break;
      case Tags.ERROR:
        tag = chalk.red(tag);
        break;
      case Tags.OK:
        tag = chalk.greenBright(tag);
        break;
      case Tags.WARN:
        tag = chalk.yellowBright(tag);
        break;
      default:
        tag = chalk.cyan(Tags.INFO);
        break;
    }

    console.log(
      chalk.grey('\n['),
      tag,
      chalk.grey(']'),
      chalk.white(`: ${message}${errorMsg}\n`)
    );
  }
}
