import Link from "./model";
import * as fs from "fs";
import Constants from "./constants";

const remark = require("remark");
const chalk = require("chalk");

export function parseFileForLinks(file: string, internalLinks: Link[], externalLinks: Link[]) {
    console.log(chalk.green("INFO: Checking file: " + file));
    const ast = remark().parse(fs.readFileSync(file, "utf-8"));
    const childrens: any[] = ast.children;
    childrens.forEach((child) => {
        getLinks(child).forEach((link) => {
            if (link.indexOf(Constants.http) >= 0 || link.indexOf(Constants.https) >= 0) {
                // not checking whether link is already present since it should be reported
                // for all files where it is wrongly referenced!
                externalLinks.push(new Link(link, file));
            } else {
                internalLinks.push(new Link(link, file));
            }
        });
    });
}

/**
 * Recursively get the links from the AST and push them into an array,
 * There are 2 types of link(external and internal) and each one have one array
 */
 export function getLinks(childOfChild: any): string[] {
    let links: string[] = [];
    if (childOfChild.children) {
        const childrenNew: any[] = childOfChild.children;
        childrenNew.forEach((subChild) => {
            if (subChild.type) {
                switch (subChild.type) {
                    case "link":
                        if (subChild.url.indexOf(Constants.localhost) >= 0) {
                            break;
                        }
                        if (subChild.url.indexOf(Constants.http) < 0 &&
                            subChild.url.indexOf(Constants.https) < 0) {
                            break;
                        }
                        links.push(fixLink(subChild.url));
                        break;
                    case "text":
                        // there are some special characters that need to be checked
                        const str = subChild.value.split("\n");
                        str.forEach((item: string) => {
                            if ((item as string).endsWith(Constants.dPlus)) {
                                return;
                            }
                            if (item.indexOf(Constants.tLink) >= 0) {
                                if (!item.startsWith(Constants.dSlash)) {
                                    links.push(getLinkValue(item));
                                }
                            } else if ((item.indexOf(Constants.image) >= 0) && (item.startsWith(Constants.dSlash) === false)) {
                                if (item.endsWith(Constants.brackets)) {
                                    item = item.substring(0, item.lastIndexOf(Constants.bracket));
                                }
                                links.push(getImageValue(item));
                            }
                        });
                    default:
                        const subLinks = getLinks(subChild);
                        links = links.concat(subLinks);
                }
            }
        });
    }
    return links;
}

/**
 * There are some links wich end with some extra character and need to be fixed
 */
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

/**
 * The value of those links in the AST with type 'link' are getting here
 */
export function getLinkValue(link: string) {
    const ref = link.split("[]")[0];
    return ref.substring(link.indexOf(Constants.tLink) + 5);
}

export function getImageValue(link: string) {
    if (link.indexOf(Constants.image) >= 0) {
        link = link.substring(link.indexOf(Constants.image) + Constants.image.length);
    }

    return link;
}

export default parseFileForLinks;