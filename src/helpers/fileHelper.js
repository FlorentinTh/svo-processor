import url from 'url';
import path from 'path';

class FileHelper {
  static getPackageJson() {
    return path.dirname(url.fileURLToPath(import.meta.url));
  }
}

export default FileHelper;
