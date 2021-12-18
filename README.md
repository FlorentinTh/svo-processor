# zed-preprocess

![platform](https://img.shields.io/badge/platform-win--32%20%7C%20win--64-lightgrey) ![node](https://img.shields.io/badge/node-%3E%3D16-blue) [![license](https://img.shields.io/github/license/florentinth/svo-processor?color=blue)](https://github.com/FlorentinTh/svo-processor/blob/master/LICENSE)
[![snyk](https://github.com/FlorentinTh/svo-processor/actions/workflows/dependencies.yml/badge.svg)](https://github.com/FlorentinTh/svo-processor/actions/workflows/dependencies.yml) [![build](https://github.com/FlorentinTh/svo-processor/actions/workflows/build.yml/badge.svg)](https://github.com/FlorentinTh/svo-processor/actions/workflows/build.yml) [![GitHub Release](https://img.shields.io/github/release/FlorentinTh/svo-processor)](https://github.com/FlorentinTh/svo-processor/releases)

CLI application to process recorded SVO files from ZED cameras.

## Authors

- [**Florentin Thullier**](https://github.com/FlorentinTh) - 2021

## Installation

### Simple

1. Download the [latest release](https://github.com/FlorentinTh/svo-processor/releases) of the executable for your platform and rename it as ```svo-processor```.

2. Copy the executable and paste it somewhere safe. For example on windows it can be : ```C:/dev/svo-processor-[release_version]/svo-processor.exe```.

3. Add the path to you environment variable :

> **Note**: replace ```<svo-processor.exe_parent_directory_path>``` by your actual path. Such as ```C:/dev/svo-processor-v1.x/```

   - **Windows** :
     - with PowerShell :
     ```sh
     $ setx PATH "%PATH%;<ws-cli.exe_parent_directory_path>"
     ```

     _your powershell session need to be restarted._

4. The command ```svo-processor``` should now be available from anywhere through your terminal.

### Manual

1. [Install or update node](https://nodejs.org/dist/latest-v16.x/) to 16.x or greater if not already done.

2. Clone this repo :
```sh
$ git clone https://github.com/FlorentinTh/svo-processor.git

# or

$ git clone git@github.com:FlorentinTh/svo-processor.git

# or

$ gh repo clone FlorentinTh/svo-processor

```

2. Build the project :

```sh
$ npm i
$ npm run build
```

3. Once completed, in the root project directory you should have a new folder called ```dist``` containing the executable. You can now follow the same instructions as for the [simple installation process](#simple) beginning at step 2.

## Usage
```
Usage:
        $ svo-processor <path> [options]

Options:
  -r, -R, --recursive  Recursively search for SVO files inside the provided
                       path.                          [boolean] [default: false]

  -o, -O, --output     Output path. It must be either a file or a folder. If the
                        output is a file, the input also require to be a path an
                       d the --convert-only flag must be set.
                                                       [string] [default: false]

  -p, -P, --process    Process to complete being either 'rgb', 'depth' or 'rgbd'
                       .                              [string] [default: "rgbd"]

  -b, -B, --begin      Trim a given number of seconds at the beginning.
                                                           [number] [default: 0]

  -e, -E, --end        Trim a given number of seconds at the end.
                                                           [number] [default: 0]

      --convert-only   Only convert SVO files into AVI format. The file
                       processing is skipped.         [boolean] [default: false]

      --avi            Search for existing AVI files to process instead of SVO
                       by default when input is a directory. The conversion is
                       skipped.                       [boolean] [default: false]

  -h, -H, --help       Show help                                       [boolean]

  -v, -V, --version    Show version number                             [boolean]
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
