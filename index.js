"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
/**
 * Use npm run start -- <file1> <file2> ... <fileN> [--concat]
 * Files must be in the input folder and have a .txt extension.
 * The --concat flag is optional and will concatenate all data into a single all.json file.
 * The output files will be saved in the output folder with the same name and a .json extension.
 */
const main = () => __awaiter(void 0, void 0, void 0, function* () {
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
    if (concatStream)
        concatStream.write("[\n"); // Start the JSON array for concatenated output
    for (const fileName of files) {
        const isTxtFile = (fileName) => path.extname(fileName).toLowerCase() === ".txt";
        if (!isTxtFile(fileName)) {
            console.error(`Skipping invalid file: ${fileName}`);
            continue;
        }
        const inputFilePath = path.join(inputFolder, fileName);
        const outputFilePath = path.join(outputFolder, fileName.replace(path.extname(fileName), ".json"));
        try {
            console.log(`Processing file: ${fileName}`);
            yield processFile(inputFilePath, outputFilePath, concatStream);
            console.log(`File processed and saved as: ${outputFilePath}`);
        }
        catch (err) {
            console.error(`Error processing file "${fileName}":`, err);
        }
    }
    if (concatStream) {
        concatStream.write("\n]"); // Close the JSON array for concatenated output
        concatStream.end();
        console.log(`All data concatenated and saved as: ${allJsonPath}`);
    }
});
const processFile = (inputFilePath, outputFilePath, concatStream) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
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
    try {
        for (var _d = true, rl_1 = __asyncValues(rl), rl_1_1; rl_1_1 = yield rl_1.next(), _a = rl_1_1.done, !_a; _d = true) {
            _c = rl_1_1.value;
            _d = false;
            const line = _c;
            lineCount++;
            logProgress(lineCount);
            if (lineCount % 10000 === 0 && typeof global.gc === "function")
                global.gc();
            const values = line.split("\t");
            if (values.length !== labels.length) {
                console.warn(`Skipping invalid line: ${line}`);
                continue;
            }
            const obj = {};
            labels.forEach((label, index) => { obj[label] = values[index]; });
            removeGarbage(obj);
            const jsonLine = JSON.stringify(obj);
            // Write to individual JSON file
            if (!firstLine)
                outputStream.write(",\n");
            outputStream.write(jsonLine);
            // Write to concatenated JSON file (if applicable)
            if (concatStream) {
                // if (concatStream.bytesWritten > 2) concatStream.write(",\n");
                // concatStream.write(jsonLine);
                concatStream.write(`${firstLine ? "" : ",\n"}${jsonLine}`);
            }
            firstLine = false;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_d && !_a && (_b = rl_1.return)) yield _b.call(rl_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    finishProgressLog();
    console.log(`Total lines processed in file: ${lineCount}`);
    outputStream.write("\n]");
    outputStream.end();
});
const logProgress = (() => {
    let lastLoggedTime = Date.now();
    return (lineCount, interval = 1000) => {
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
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created missing directory: ${dirPath}`);
    }
};
const removeGarbage = (obj) => {
    // Check if the postalCode exists and remove the " CEDEX XX" part if it does
    if (obj.postalCode && typeof obj.postalCode === "string") {
        // Remove " CEDEX XX" from postalCode
        obj.postalCode = obj.postalCode.replace(/\s*CEDEX\s+\d{2}$/, "").trim();
    }
};
main();
