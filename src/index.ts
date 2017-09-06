import * as fs from "fs";
import * as glob from "glob";
import * as request from "superagent";
import Constants from "./constants";

const remark = require("remark");

const linkExternalFile: string[] = [];
const externalLinks: string[] = [];

/**
 * Read each asciidoc of the directory where the wiki has been cloned and call the function
 * getlinks to iterate for each one.
 * Glob allows you to searh inside a directory all the files with a certain extension, in this case 'asciidoc'
 */

export function linkChecker(dir: string) {

    const linkFile: string[] = [];
    const links: string[] = [];

    glob(dir + "*" + Constants.adoc, async (err: any, files: any) => {
        if (files.length === 0) {
            console.log("Directory not found or empty.");
        } else {
            files.forEach(
                (file: any) => {
                    const ast = remark().parse(fs.readFileSync(file, "utf-8"));
                    const childrens: any[] = ast.children;
                    childrens.forEach((child) => {
                        getLinks(child).forEach((link) => {
                            if (link.indexOf(Constants.http) >= 0 || link.indexOf(Constants.https) >= 0) {
                                if (!(externalLinks.indexOf(link) > 0)) {
                                    externalLinks.push(link);
                                    linkExternalFile.push(file);
                                }
                            } else {
                                if (!(links.indexOf(link) > 0)) {
                                    links.push(link);
                                    linkFile.push(file);
                                }
                            }
                        });
                    });
                });

            const code1 = await checkLinks(externalLinks);
            const code2 = await checkInternalLinks(links, linkFile, dir);
            exitCode(code1, code2);
        }
    });
}

/**
 * Receives 2 codes(1 code for external links and 1 code for internal links, compare them and show the output
 */

export function exitCode(code1: boolean, code2: boolean) {

    if (code1 && code2) {
        console.log("Done: All links are correct");
        process.exit();
    } else {
        console.log("DONE: Some link failed");
        process.exit(1);
    }

}

/**
 * Function to do a HEAD request for the external links returning the status
 * returns code = true if status 200 or code = false if status 404
 */
export async function sendRequest(link: string): Promise < boolean > {
    const req = link;
    let response: any;
    const code: boolean = true;
    return new Promise < boolean > ((resolve, reject) =>
        request.head(req).end((err: any, res: request.Response) => {
            if (res === undefined) {
                console.log(linkExternalFile[externalLinks.indexOf(link)] + " " +
                    Constants.arrow + " " + link + " site can't be reached");
            } else {
                response = res.status;
                // Request to private repositories need autentication
                if (response === 404 && link.indexOf(Constants.github) >= 0) {
                    console.log(linkExternalFile[externalLinks.indexOf(link)] + " " +
                        Constants.arrow + " " + link + " cannot be verified");
                } else {
                    if (response === 404) {
                        console.log(Constants.red, linkExternalFile[externalLinks.indexOf(link)] + " " +
                            Constants.arrow + " " + link + " " + Constants.arrow + " " + response, Constants.white);
                        resolve(false);
                        return;
                    }
                }
            }

            resolve(true);
        }));
}

/** Recursively get the links from the AST and push them into an array,
 * There are 2 types of link(external and internal) and each one have one array
 */

export function getLinks(childOfChild: any): string[] {
    const links: string[] = [];
    if (childOfChild.children) {
        const childrenNew: any[] = childOfChild.children;
        childrenNew.forEach((subChild) => {
            if (subChild.type) {
                switch (subChild.type) {
                    case "link":
                        if (subChild.url.indexOf(Constants.localhost) >= 0) {
                            break;
                        }
                        links.push(fixLink(subChild.url));
                        break;
                    case "text":
                        // there are some special characters that need to be checked
                        if ((subChild.value as string).endsWith(Constants.dPlus)) {
                            break;
                        }
                        let str = subChild.value;
                        if (str.indexOf(Constants.tLink) >= 0) {
                            if (str.startsWith(Constants.dSlash) === false) {
                                links.push(getLinkValue(str));
                            }
                        } else if ((str.indexOf(Constants.image) >= 0) && (str.startsWith(Constants.dSlash) === false)) {
                            if (str.endsWith(Constants.brackets)) {
                                str = str.substring(0, str.lastIndexOf(Constants.bracket));
                            }
                            links.push(getImageValue(str));
                        }
                    default:
                        return getLinks(subChild);
                }
            }
        });
    }
    return links;
}

/** There are some links wich end with some extra character and need to be fixed */

export function fixLink(link: string) {
    if (link.indexOf(Constants.bracket) >= 0) {
        return link.substring(0, link.indexOf(Constants.bracket));

    } else if (link.indexOf(Constants.quote) > 0) {
        return link.substring(0, link.indexOf(Constants.quote));
    } else if (link.indexOf(Constants.dQuote) > 0) {
        return link.substring(0, link.indexOf(Constants.dQuote));
    } else {
        return link;
    }
}
/** The value of those links in the AST with type 'link' are getting here */

export function getLinkValue(link: string) {

    return link.substring(link.indexOf(Constants.tLink) + 5);
}

export function getImageValue(link: string) {
    if (link.indexOf(Constants.images) >= 0) {
        return link.substring(link.indexOf(Constants.images));
    } else if ((link.indexOf(Constants.http) >= 0) || (link.indexOf(Constants.https) >= 0)) {
        return link.substring(link.indexOf("http"));
    } else {
        return link.substring(link.indexOf(Constants.dColon) + 2);
    }
}

/** Verify the links */
export async function checkLinks(eLinks: string[]) {

    if (eLinks.length === 0) {
        process.exit(1);
    }
    const code = await Promise.all(eLinks.map(sendRequest));
    return code.reduce((a, b) => a && b);
}

/** There are 2 types of InternalLinks, anchor types(#) and resource types(/) */
export async function checkInternalLinks(Ilinks: string[], linkFile: string[], dir: string) {

    const links = Ilinks;
    const adoc = Constants.adoc;
    let code = true;

    for (let i = 0; i < Ilinks.length; i++) {
        // anchor type
        if (Ilinks[i].indexOf(Constants.hash) > 0) {
            const str = (Ilinks[i].substring(0, Ilinks[i].indexOf(Constants.hash)));
            if (!(fs.existsSync(dir + str + adoc))) {
                console.log(Constants.red, linkFile[links.indexOf(Ilinks[i])] + " " +
                    Constants.arrow + dir + str + adoc + " False", Constants.white);
                code = false;
            }
            // resource type
        } else {
            if (!(fs.existsSync(dir + Ilinks[i])) && !(fs.existsSync(dir + Ilinks[i] + Constants.adoc))) {
                code = false;
                console.log(Constants.red, linkFile[links.indexOf(Ilinks[i])] + " " +
                    Constants.arrow + " " + dir + Ilinks[i] + " False", Constants.white);

            }
        }
    }
    return code;
}
