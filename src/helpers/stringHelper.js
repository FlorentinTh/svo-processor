class StringHelper {
  static isString(str) {
    return Object.prototype.toString.call(str) === '[object String]';
  }

  static capitalizeFirstWord(str) {
    return str.substr(0, 1).toUpperCase() + str.substr(1).toLowerCase();
  }
}

export default StringHelper;
