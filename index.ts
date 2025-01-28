import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

/**
 * Use npm run start -- <file1> <file2> ... <fileN> [--concat]
 * Files must be in the input folder and have a .txt extension.
 * The --concat flag is optional and will concatenate all data into a single all.json file.
 * The output files will be saved in the output folder with the same name and a .json extension.
 *
 * Data files are from https://download.geonames.org/export/zip
 */

const main = async () => {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Please provide at least one file name as an argument.");
    process.exit(1);
  }

  const inputFolder = path.join(__dirname, "input");
  const outputFolder = path.join(__dirname, "output");

  ensureDirectoryExists(inputFolder);
  ensureDirectoryExists(outputFolder);

  const concatFlagIndex = args.indexOf("--concat");
  const files = concatFlagIndex !== -1 ? args.slice(0, concatFlagIndex) : args;
  const shouldConcat = concatFlagIndex !== -1;

  const allJsonPath = path.join(outputFolder, "all.json");
  const concatStream = shouldConcat ? fs.createWriteStream(allJsonPath) : null;

  if (concatStream) concatStream.write("[\n"); // Start the JSON array for concatenated output

  for (const fileName of files) {
    const isTxtFile = (fileName: string) =>
      path.extname(fileName).toLowerCase() === ".txt";

    if (!isTxtFile(fileName)) {
      console.error(`Skipping invalid file: ${fileName}`);
      continue;
    }

    const inputFilePath = path.join(inputFolder, fileName);
    const outputFilePath = path.join(
      outputFolder,
      fileName.replace(path.extname(fileName), ".json")
    );

    try {
      console.log(`Processing file: ${fileName}`);

      await processFile(inputFilePath, outputFilePath, concatStream);

      console.log(`File processed and saved as: ${outputFilePath}`);
    } catch (err) {
      console.error(`Error processing file "${fileName}":`, err);
    }
  }

  if (concatStream) {
    concatStream.write("\n]"); // Close the JSON array for concatenated output
    concatStream.end();
    console.log(`All data concatenated and saved as: ${allJsonPath}`);
  }
};

const processFile = async (
  inputFilePath: string,
  outputFilePath: string,
  concatStream: fs.WriteStream | null
) => {
  const labels = [
    "countryCode",
    "postalCode",
    "city",
    "region",
    "regionCode",
    "department",
    "departmentCode",
    "commune",
    "communeCode",
    "latitude",
    "longitude",
    "accuracy",
  ];

  const inputStream = fs.createReadStream(inputFilePath, {
    highWaterMark: 1024 * 1024,
  });
  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  const outputStream = fs.createWriteStream(outputFilePath, {
    highWaterMark: 1024 * 1024,
  });
  outputStream.write("[\n");

  let firstLine = true;
  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;
    logProgress(lineCount);

    if (lineCount % 10000 === 0 && typeof global.gc === "function") global.gc();

    const values = line.split("\t");
    if (values.length !== labels.length) {
      console.warn(`Skipping invalid line: ${line}`);
      continue;
    }

    const obj: Record<string, any> = {};
    labels.forEach((label, index) => {
      obj[label] = values[index];
    });

    removeGarbage(obj);

    const jsonLine = JSON.stringify(obj);

    // Write to individual JSON file
    if (!firstLine) outputStream.write(",\n");
    outputStream.write(jsonLine);

    // Write to concatenated JSON file (if applicable)
    if (concatStream) {
      // if (concatStream.bytesWritten > 2) concatStream.write(",\n");
      // concatStream.write(jsonLine);
      concatStream.write(`${firstLine ? "" : ",\n"}${jsonLine}`);
    }

    firstLine = false;
  }

  finishProgressLog();
  console.log(`Total lines processed in file: ${lineCount}`);
  outputStream.write("\n]");
  outputStream.end();
};

const logProgress = (() => {
  let lastLoggedTime = Date.now();
  return (lineCount: number, interval: number = 1000) => {
    const now = Date.now();
    if (now - lastLoggedTime >= 1000 || lineCount === 1) {
      process.stdout.write(`\rProcessed ${lineCount} lines...`);
      lastLoggedTime = now;
    }
  };
})();

const finishProgressLog = () => {
  process.stdout.write("\n");
};

const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created missing directory: ${dirPath}`);
  }
};

const removeGarbage = (obj: Record<string, any>) => {
  // Check if the postalCode exists and remove the " CEDEX XX" part if it does
  if (obj.postalCode && typeof obj.postalCode === "string") {
    // Remove " CEDEX XX" from postalCode
    obj.postalCode = obj.postalCode.replace(/\s*CEDEX\s+\d{2}$/, "").trim();
  }
};

main();
