import * as path from "path";
import * as fs from "fs";
import Constants from "./constants";
import Link, { LinkCheckResult } from "./model";

const chalk = require("chalk");

/**
 * There are 2 types of InternalLinks, anchor types(#) and resource types(/)
 */
export async function checkInternalLinks(internalLinks: Link[], enforceInternalHtmlLinks: boolean) : Promise<LinkCheckResult> {
    let invalidLinks = 0;

    for (let i = 0; i < internalLinks.length; i++) {
        const link = internalLinks[i];
        const hashIndex = link.value.indexOf(Constants.hash);
        const linkValue = hashIndex > 0;
            ? (link.value.substring(0, hashIndex))
            : link.value;
        const sourceFileInfo = path.parse(link.sourceFile);
        const sourceFileDir = sourceFileInfo.dir + "/";

        if (!existsInternalFile(sourceFileDir, linkValue, enforceInternalHtmlLinks)) {
            invalidLinks++;
            console.log(chalk.red("ERROR: ") + link.sourceFile + " " +
                Constants.arrow + " " + sourceFileDir + linkValue + chalk.red(" " + Constants.arrow + " internal link not found"));

        }

    }
    return new LinkCheckResult(internalLinks.length, invalidLinks);
}

function existsInternalFile(sourceFileDir: string, link: string, enforceInternalHtmlLinks: boolean) {
    if(enforceInternalHtmlLinks) {
        if (link.endsWith(Constants.eAdoc) || link.endsWith(Constants.eAsciidoc)) {
            return false;
        }
        // Taking HTML away so subsequent check will succeed
        link = link.replace(Constants.eHtml, "");
    }
    return (fs.existsSync(sourceFileDir + link)) ||
        (fs.existsSync(sourceFileDir + link + Constants.eAsciidoc)) ||
        (fs.existsSync(sourceFileDir + link + Constants.eAdoc));
}

export default checkInternalLinks;