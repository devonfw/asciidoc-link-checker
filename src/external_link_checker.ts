import {Link, LinkCheckResult} from "./model";
import * as request from "superagent";
import Constants from "./constants";

const chalk = require("chalk");

/**
 * Verify the links
 */
 export async function checkExternalLinks(externalLinks: Link[]) : Promise<LinkCheckResult> {

    if (externalLinks.length === 0) {
        return new LinkCheckResult(0, 0);
    }
    const code = await Promise.all(externalLinks.map(sendRequest));
    const invalidLinks = code.map<number>(v => v ? 0 : 1).reduce((a, b) => a + b);
    return new LinkCheckResult(externalLinks.length, invalidLinks);
}

/**
 * Function to do a HEAD request for the external links returning the status
 * returns code = true if status 200 or code = false if status 404
 */
 export async function sendRequest(link: Link): Promise < boolean > {
    const req = link.value;
    let response: any;
    const code: boolean = true;
    // Note: some sites like e.g. https://marketplace.visualstudio.com do not support HEAD as request...
    return new Promise < boolean > ((resolve, reject) =>
        request.get(req).end((err: any, res: request.Response) => {
            if (res === undefined) {
                console.log(chalk.yellow("WARNING: ") + link.sourceFile + " " +
                    Constants.arrow + " " + link.value + " " + chalk.blue(Constants.arrow + " site cannot be reached"));
            } else {
                response = res.status;
                // Request to private repositories need autentication
                if (response === 404 && link.value.indexOf(Constants.github) >= 0) {
                    console.log(chalk.yellow("WARNING: ") + link.sourceFile + " " +
                        Constants.arrow + " " + link.value + " " + chalk.blue(Constants.arrow + " cannot be verified"));
                } else {
                    if (response === 404) {
                        console.log(chalk.red("ERROR: ") + link.sourceFile + " " +
                            Constants.arrow + " " + link.value + " " + chalk.red(Constants.arrow + " " + response));
                        resolve(false);
                        return;
                    }
                }
            }

            resolve(true);
        }));
}

export default checkExternalLinks;