import Link from "./model";
import * as fs from "fs";
import Constants from "./constants";

const remark = require("remark");
const chalk = require("chalk");

const imagesdirRegEx : RegExp = /:imagesdir:\s+(\S+)/;
let imagesdir = "";

/** 
 * List of tags used for internal linkage of resources.
 * NOTE: order is important here since tInlineImage is a subset of tImage and must be checked after!
 */
const internalLinkTags = [Constants.tLink, Constants.tXref, Constants.tImage, Constants.tInlineImage]

export function parseFileForLinks(file: string, internalLinks: Link[], externalLinks: Link[]) {
    console.log(chalk.green("INFO: Checking file: " + file));
    const ast = remark().parse(fs.readFileSync(file, "utf-8"));
    const childrens: any[] = ast.children;
    childrens.forEach((child) => {
        // Note that we do not check whether link is already present since it should be reported
        // for all files where it is wrongly referenced!
        getLinks(child, file).forEach((link) => {
            if (link.external) {
                externalLinks.push(link);
            } else {
                internalLinks.push(link);
            }
        });
    });
}

/**
 * Recursively get the links from the AST and push them into an array,
 * There are 2 types of link(external and internal) and each one have one array
 */
 export function getLinks(childOfChild: any, file: string): Link[] {
    let links: Link[] = [];
    if (childOfChild.children) {
        const childrenNew: any[] = childOfChild.children;
        childrenNew.forEach((subChild) => {
            if (subChild.type) {
                switch (subChild.type) {
                    case "xref":
                        links.push(new Link(subChild.url, file, Constants.tXref));
                    case "link":
                        if (subChild.url.indexOf(Constants.localhost) >= 0) {
                            break;
                        }
                        if (subChild.url.indexOf(Constants.http) < 0 &&
                            subChild.url.indexOf(Constants.https) < 0) {
                            break;
                        }
                        links.push(new Link(fixLink(subChild.url), file, Constants.tLink));
                        break;
                    case "text":
                        // there are some special characters that need to be checked
                        const lines = subChild.value.split("\n");
                        lines.forEach((line: string) => {
                            if (line.endsWith(Constants.dPlus) || line.startsWith(Constants.dSlash)) {
                                return;
                            }
                            for (let tag of internalLinkTags) {
                                if (line.indexOf(tag) >= 0) {
                                    let link = new Link(getLinkValue(line, tag, imagesdir), file, tag);
                                    if (link.value && link.value.length > 0) {
                                        // for some reason external links listed as link and text nodes
                                        // in the text nodes they consist however only of "link:"
                                        links.push(link);
                                    }
                                    break;
                                }
                            }
                            let imagesdirCheck =  imagesdirRegEx.exec(line);
                            if(imagesdirCheck) {
                                imagesdir = imagesdirCheck[1];
                            }
                        });
                    default:
                        const subLinks = getLinks(subChild, file);
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
export function getLinkValue(link: string, tag: string, imagesdir: string) {
    const ref = link.split("[]")[0];
    const linkValue =  ref.substring(link.indexOf(tag) + tag.length);
    return isImage(tag) ? imagesdir + "/" + linkValue : linkValue;
}

function isImage(tag: string) {
    return tag === Constants.tImage || tag === Constants.tInlineImage; 
}

export default parseFileForLinks;