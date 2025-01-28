### Installation

1. Clone this repository.
2. Run `npm install` to install the required dependencies.

### Usage

```bash
npm run start -- <file1> <file2> ... <fileN> [--concat]
```

### Arguments

- `<file1>`, `<file2>`, `...`, `<fileN>`: The names of the Geonames.org text files to process. The files must be in the `input` folder and have a `.txt` extension.
- `--concat` **(optional)**: If provided, all processed data will be concatenated into a single file named `all.json` in the `output` folder.

### Output

- For each input file, a JSON file with the same name (replacing the `.txt` extension with `.json`) will be saved in the `output` folder.
- If the `--concat` flag is provided, a file named `all.json` containing all processed data will be saved in the `output` folder.

### Data source

The script expects Geonames.org text files to be located in the `input` folder. You can download these files from https://download.geonames.org/export/zip.

### Notes

- This script uses Node.js and the following npm packages:
  - fs
  - path
  - readline
- The script assumes that the Geonames.org text files have tab-delimited columns.

> Tested with Node.js v22.12.0 on Ubuntu 20.04.4 LTS. I cannot guarantee that it will work on other operating systems or Node.js versions.

### Example

```bash
npm run start -- FR.txt ES.txt --concat
```

This command will process the files `FR.txt` and `ES.txt` and save the converted JSON data in the following files:

- `output/FR.json`
- `output/ES.json`
- `output/all.json` (concatenated data)
