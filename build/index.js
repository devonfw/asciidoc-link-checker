"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const glob = require("glob");
const request = require("superagent");
const constants_1 = require("./constants");
const remark = require("remark");
const linkExternalFile = [];
const externalLinks = [];
/**
 * Read each asciidoc of the directory where the wiki has been cloned and call the function
 * getlinks to iterate for each one.
 * Glob allows you to searh inside a directory all the files with a certain extension, in this case 'asciidoc'
 */
function linkChecker(dir) {
    const linkFile = [];
    const links = [];
    glob(dir + "*" + constants_1.default.adoc, (err, files) => __awaiter(this, void 0, void 0, function* () {
        if (files.length === 0) {
            console.log("Directory not found or empty.");
        }
        else {
            files.forEach((file) => {
                const ast = remark().parse(fs.readFileSync(file, "utf-8"));
                const childrens = ast.children;
                childrens.forEach((child) => {
                    getLinks(child).forEach((link) => {
                        if (link.indexOf(constants_1.default.http) >= 0 || link.indexOf(constants_1.default.https) >= 0) {
                            if (!(externalLinks.indexOf(link) > 0)) {
                                externalLinks.push(link);
                                linkExternalFile.push(file);
                            }
                        }
                        else {
                            if (!(links.indexOf(link) > 0)) {
                                links.push(link);
                                linkFile.push(file);
                            }
                        }
                    });
                });
            });
            const code1 = yield checkLinks(externalLinks);
            const code2 = yield checkInternalLinks(links, linkFile, dir);
            exitCode(code1, code2);
        }
    }));
}
exports.linkChecker = linkChecker;
/**
 * Receives 2 codes(1 code for external links and 1 code for internal links, compare them and show the output
 */
function exitCode(code1, code2) {
    if (code1 && code2) {
        console.log("Done: All links are correct");
        process.exit();
    }
    else {
        console.log("DONE: Some link failed");
        process.exit(1);
    }
}
exports.exitCode = exitCode;
/**
 * Function to do a HEAD request for the external links returning the status
 * returns code = true if status 200 or code = false if status 404
 */
function sendRequest(link) {
    return __awaiter(this, void 0, void 0, function* () {
        const req = link;
        let response;
        const code = true;
        return new Promise((resolve, reject) => request.head(req).end((err, res) => {
            if (res === undefined) {
                console.log(linkExternalFile[externalLinks.indexOf(link)] + " " +
                    constants_1.default.arrow + " " + link + " site can't be reached");
            }
            else {
                response = res.status;
                // Request to private repositories need autentication
                if (response === 404 && link.indexOf(constants_1.default.github) >= 0) {
                    console.log(linkExternalFile[externalLinks.indexOf(link)] + " " +
                        constants_1.default.arrow + " " + link + " cannot be verified");
                }
                else {
                    if (response === 404) {
                        console.log(constants_1.default.red, linkExternalFile[externalLinks.indexOf(link)] + " " +
                            constants_1.default.arrow + " " + link + " " + constants_1.default.arrow + " " + response, constants_1.default.white);
                        resolve(false);
                        return;
                    }
                }
            }
            resolve(true);
        }));
    });
}
exports.sendRequest = sendRequest;
/** Recursively get the links from the AST and push them into an array,
 * There are 2 types of link(external and internal) and each one have one array
 */
function getLinks(childOfChild) {
    const links = [];
    if (childOfChild.children) {
        const childrenNew = childOfChild.children;
        childrenNew.forEach((subChild) => {
            if (subChild.type) {
                switch (subChild.type) {
                    case "link":
                        if (subChild.url.indexOf(constants_1.default.localhost) >= 0) {
                            break;
                        }
                        links.push(fixLink(subChild.url));
                        break;
                    case "text":
                        // there are some special characters that need to be checked
                        if (subChild.value.endsWith(constants_1.default.dPlus)) {
                            break;
                        }
                        let str = subChild.value;
                        if (str.indexOf(constants_1.default.tLink) >= 0) {
                            if (str.startsWith(constants_1.default.dSlash) === false) {
                                links.push(getLinkValue(str));
                            }
                        }
                        else if ((str.indexOf(constants_1.default.image) >= 0) && (str.startsWith(constants_1.default.dSlash) === false)) {
                            if (str.endsWith(constants_1.default.brackets)) {
                                str = str.substring(0, str.lastIndexOf(constants_1.default.bracket));
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
exports.getLinks = getLinks;
/** There are some links wich end with some extra character and need to be fixed */
function fixLink(link) {
    if (link.indexOf(constants_1.default.bracket) >= 0) {
        return link.substring(0, link.indexOf(constants_1.default.bracket));
    }
    else if (link.indexOf(constants_1.default.quote) > 0) {
        return link.substring(0, link.indexOf(constants_1.default.quote));
    }
    else if (link.indexOf(constants_1.default.dQuote) > 0) {
        return link.substring(0, link.indexOf(constants_1.default.dQuote));
    }
    else {
        return link;
    }
}
exports.fixLink = fixLink;
/** The value of those links in the AST with type 'link' are getting here */
function getLinkValue(link) {
    return link.substring(link.indexOf(constants_1.default.tLink) + 5);
}
exports.getLinkValue = getLinkValue;
function getImageValue(link) {
    if (link.indexOf(constants_1.default.images) >= 0) {
        return link.substring(link.indexOf(constants_1.default.images));
    }
    else if ((link.indexOf(constants_1.default.http) >= 0) || (link.indexOf(constants_1.default.https) >= 0)) {
        return link.substring(link.indexOf("http"));
    }
    else {
        return link.substring(link.indexOf(constants_1.default.dColon) + 2);
    }
}
exports.getImageValue = getImageValue;
/** Verify the links */
function checkLinks(eLinks) {
    return __awaiter(this, void 0, void 0, function* () {
        if (eLinks.length === 0) {
            process.exit(1);
        }
        const code = yield Promise.all(eLinks.map(sendRequest));
        return code.reduce((a, b) => a && b);
    });
}
exports.checkLinks = checkLinks;
/** There are 2 types of InternalLinks, anchor types(#) and resource types(/) */
function checkInternalLinks(Ilinks, linkFile, dir) {
    return __awaiter(this, void 0, void 0, function* () {
        const links = Ilinks;
        const adoc = constants_1.default.adoc;
        let code = true;
        for (let i = 0; i < Ilinks.length; i++) {
            // anchor type
            if (Ilinks[i].indexOf(constants_1.default.hash) > 0) {
                const str = (Ilinks[i].substring(0, Ilinks[i].indexOf(constants_1.default.hash)));
                if (!(fs.existsSync(dir + str + adoc))) {
                    console.log(constants_1.default.red, linkFile[links.indexOf(Ilinks[i])] + " " +
                        constants_1.default.arrow + dir + str + adoc + " False", constants_1.default.white);
                    code = false;
                }
                // resource type
            }
            else {
                if (!(fs.existsSync(dir + Ilinks[i])) && !(fs.existsSync(dir + Ilinks[i] + constants_1.default.adoc))) {
                    code = false;
                    console.log(constants_1.default.red, linkFile[links.indexOf(Ilinks[i])] + " " +
                        constants_1.default.arrow + " " + dir + Ilinks[i] + " False", constants_1.default.white);
                }
            }
        }
        return code;
    });
}
exports.checkInternalLinks = checkInternalLinks;
