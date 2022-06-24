import * as glob from "glob";
import Constants from "./constants";
import Link, { LinkCheckResult } from "./model";
import parseFileForLinks from "./parser";
import checkInternalLinks from "./internal_link_checker";
import checkExternalLinks from "./external_link_checker";

const chalk = require("chalk");


/**
 * Read each asciidoc of the directory where the wiki has been cloned and call the function
 * getlinks to iterate for each one.
 * Glob allows you to searh inside a directory all the files with a certain extension, in this case 'asciidoc'
 */

export function linkChecker(dir: string, enforceInternalHtmlLinks:boolean = false) {

    console.log(chalk.green("INFO: Checking dir: " + dir));
    const externalLinks: Link[] = [];
    const internalLinks: Link[] = [];

    glob(dir + "**/*" + Constants.adoc, async (err: any, files: any) => {
        if (files.length === 0) {
            console.log(chalk.red("ERROR: Directory not found or empty."));
        } else {
            files.forEach(
                (file: string) => {
                    parseFileForLinks(file, internalLinks, externalLinks);
                });

            const externalCheckResult = await checkExternalLinks(externalLinks);
            const internalCheckResult = await checkInternalLinks(internalLinks, enforceInternalHtmlLinks);
            exit(externalCheckResult, internalCheckResult);
        }
    });
}

/**
 * Receives 2 codes(1 code for external links and 1 code for internal links, compare them and show the output
 */
export function exit(externalResult: LinkCheckResult, internalResult: LinkCheckResult) {

    console.log("\nValidation result");
    logResult("External links: ", externalResult);
    logResult("Internal links: ", internalResult);
    if (externalResult.invalidNo + internalResult.invalidNo === 0) {
        console.log(chalk.green("\nDONE: All links are correct."));
        process.exit();
    } else {
        console.log(chalk.red("\nDONE: Some links failed."));
        process.exit(1);
    }

}

function logResult(prefix: string, result: LinkCheckResult) {
    console.log(`${prefix} ` + chalk.green(`${result.validNo} valid `) + " / " +chalk.red(`${result.invalidNo} invalid`));
}


