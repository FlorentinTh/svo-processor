import url from 'url';
import path from 'path';
import fs from 'fs';
class FileHelper {
  static get __dirname() {
    return path.dirname(url.fileURLToPath(import.meta.url));
  }

  static getPackageJson() {
    const filePath = path.join(this.__dirname, '..', '..', 'package.json');
    return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }));
  }
}

export default FileHelper;
