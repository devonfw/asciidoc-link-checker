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
const request = require("superagent");
const glob = require("glob");
let remark = require('remark');
let directory; // wiki directory
let links = [];
let linkFile = [];
let external_links = [];
let linkExternalFile = [];
/**Read each asciidoc of the directory where the wiki has been cloned and call the function getlinks to iterate for each one */
function linkChecker(dir) {
    directory = dir;
    glob(directory + '*asciidoc', function (err, files) {
        return __awaiter(this, void 0, void 0, function* () {
            files.forEach(function (file) {
                let ast = remark().parse(fs.readFileSync(file, 'utf-8'));
                let childrens = ast.children;
                childrens.forEach(child => {
                    getLinks(child).forEach(link => {
                        if (link.indexOf('http:') >= 0 || link.indexOf('https:') >= 0) {
                            if (!(external_links.indexOf(link) > 0)) {
                                external_links.push(link);
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
            let code1 = yield checkLinks(external_links);
            let code2 = yield checkInternalLinks(links);
            exitCode(code1, code2);
        });
    });
}
exports.linkChecker = linkChecker;
/**Receives 2 codes(1 code for external links and 1 code for internal links, compare them and show the output*/
function exitCode(code1, code2) {
    if (code1 && code2) {
        console.log('DONE: exit code 0 ');
        process.exit();
    }
    else {
        console.log('DONE: Some link failed, exit code 1 ');
        process.exit(1);
    }
}
/**Function to do a HEAD request for the external links returning the status
 * returns code = true if status 200 or code = false if status 404
*/
function sendRequest(link) {
    return __awaiter(this, void 0, void 0, function* () {
        let req = link;
        let response;
        let code = true;
        return new Promise((resolve, reject) => request.
            head(req).
            end(function (err, res) {
            if (res == undefined) {
                console.log(linkExternalFile[external_links.indexOf(link)] + " --> " + link + " " + 'site cant be reached');
            }
            else {
                response = res.status;
                /**Request to private repositories need autentication */
                if (response == 404 && link.indexOf('https://github.com') >= 0) {
                    console.log(linkExternalFile[external_links.indexOf(link)] + " --> " + link + ' cannot be verified');
                }
                else {
                    if (response == 404) {
                        console.log('\x1b[31m', linkExternalFile[external_links.indexOf(link)] + " --->" + link + " -->" + response, '\x1b[0m');
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
/**Recursively get the links from the AST and push them into an array, there are 2 types of link(external and internal) and each one have one array */
function getLinks(childOfChild) {
    let links = [];
    if (childOfChild.children) {
        let childrenNew = childOfChild.children;
        childrenNew.forEach(subChild => {
            if (subChild.type) {
                switch (subChild.type) {
                    case 'link':
                        if (subChild.url.indexOf('http://localhost') >= 0) {
                            break;
                        }
                        links.push(fixLink(subChild.url));
                        break;
                    case 'text':
                        /**there are some special characters that need to be checked */
                        if (subChild.value.endsWith("++")) {
                            break;
                        }
                        let str = subChild.value;
                        if (str.indexOf('link:') >= 0) {
                            if (str.startsWith("//") == false) {
                                links.push(getLinkValue(str));
                            }
                        }
                        else if ((str.indexOf('image::') >= 0) && (str.startsWith("//") == false)) {
                            if (str.endsWith('[]')) {
                                str = str.substring(0, str.lastIndexOf('['));
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
/**There are some links wich end with some extra character and need to be fixed */
function fixLink(link) {
    if (link.indexOf('[') >= 0) {
        return link.substring(0, link.indexOf('['));
    }
    else if (link.indexOf("'") > 0) {
        return link.substring(0, link.indexOf("'"));
    }
    else if (link.indexOf('"') > 0) {
        return link.substring(0, link.indexOf('"'));
    }
    else
        return link;
}
exports.fixLink = fixLink;
/**The value of those links in the AST with type 'link' are getting here */
function getLinkValue(link) {
    return link.substring(link.indexOf('link:') + 5);
}
exports.getLinkValue = getLinkValue;
function getImageValue(link) {
    if (link.indexOf('images') >= 0) {
        return link.substring(link.indexOf('images'));
    }
    else if ((link.indexOf('http:') >= 0) || (link.indexOf('https:') >= 0)) {
        return link.substring(link.indexOf('http'));
    }
    else
        return link.substring(link.indexOf('::') + 2);
}
exports.getImageValue = getImageValue;
/**Verify the links */
function checkLinks(eLinks) {
    return __awaiter(this, void 0, void 0, function* () {
        if (eLinks.length === 0)
            process.exit(1);
        let code = yield Promise.all(eLinks.map(sendRequest));
        return code.reduce((a, b) => a && b);
    });
}
/**There are 2 types of InternalLinks, anchor types(#) and resource types(/) */
function checkInternalLinks(Ilinks) {
    return __awaiter(this, void 0, void 0, function* () {
        let adoc = '.asciidoc';
        let code = true;
        for (let i = 0; i < Ilinks.length; i++) {
            //anchor type
            if (Ilinks[i].indexOf('#') > 0) {
                let str = (Ilinks[i].substring(0, Ilinks[i].indexOf('#')));
                if (!(fs.existsSync(directory + str + adoc))) {
                    console.log('\x1b[31m', linkFile[links.indexOf(Ilinks[i])] + " ---> " + directory + str + adoc + ' False', '\x1b[0m');
                    code = false;
                }
            }
            else {
                if (!(fs.existsSync(directory + Ilinks[i])) && !(fs.existsSync(directory + Ilinks[i] + '.asciidoc'))) {
                    code = false;
                    console.log('\x1b[31m', linkFile[links.indexOf(Ilinks[i])] + " ---> " + directory + Ilinks[i] + ' False', '\x1b[0m');
                }
            }
        }
        return code;
    });
}
