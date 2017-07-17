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
const enum_1 = require("./enum");
let remark = require('remark');
let directory;
let links = [];
let linkFile = [];
let external_links = [];
let linkExternalFile = [];
/**Read each asciidoc of the directory where the wiki has been cloned and call the function    getlinks to iterate for each one.
* glob allows you to searh inside a directory all the files with a certain extension, in this case 'asciidoc'
 */
function linkChecker(dir) {
    directory = dir;
    glob(directory + '*' + enum_1.default.adoc, function (err, files) {
        return __awaiter(this, void 0, void 0, function* () {
            files.forEach(function (file) {
                let ast = remark().parse(fs.readFileSync(file, 'utf-8'));
                let childrens = ast.children;
                childrens.forEach(child => {
                    getLinks(child).forEach(link => {
                        if (link.indexOf(enum_1.default.http) >= 0 || link.indexOf(enum_1.default.https) >= 0) {
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
                console.log(linkExternalFile[external_links.indexOf(link)] + " " + enum_1.default.arrow + " " + link + ' site cant be reached');
            }
            else {
                response = res.status;
                /**Request to private repositories need autentication */
                if (response == 404 && link.indexOf(enum_1.default.github) >= 0) {
                    console.log(linkExternalFile[external_links.indexOf(link)] + " " + enum_1.default.arrow + " " + link + ' cannot be verified');
                }
                else {
                    if (response == 404) {
                        console.log(enum_1.default.red, linkExternalFile[external_links.indexOf(link)] + " " + enum_1.default.arrow + " " + link + " " + enum_1.default.arrow + " " + response, enum_1.default.white);
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
                        if (subChild.url.indexOf(enum_1.default.localhost) >= 0) {
                            break;
                        }
                        links.push(fixLink(subChild.url));
                        break;
                    case 'text':
                        /**there are some special characters that need to be checked */
                        if (subChild.value.endsWith(enum_1.default.d_plus)) {
                            break;
                        }
                        let str = subChild.value;
                        if (str.indexOf(enum_1.default.T_link) >= 0) {
                            if (str.startsWith(enum_1.default.d_slash) == false) {
                                links.push(getLinkValue(str));
                            }
                        }
                        else if ((str.indexOf(enum_1.default.image) >= 0) && (str.startsWith(enum_1.default.d_slash) == false)) {
                            if (str.endsWith(enum_1.default.brackets)) {
                                str = str.substring(0, str.lastIndexOf(enum_1.default.bracket));
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
    if (link.indexOf(enum_1.default.bracket) >= 0) {
        return link.substring(0, link.indexOf(enum_1.default.bracket));
    }
    else if (link.indexOf(enum_1.default.quote) > 0) {
        return link.substring(0, link.indexOf(enum_1.default.quote));
    }
    else if (link.indexOf(enum_1.default.d_quote) > 0) {
        return link.substring(0, link.indexOf(enum_1.default.d_quote));
    }
    else
        return link;
}
exports.fixLink = fixLink;
/**The value of those links in the AST with type 'link' are getting here */
function getLinkValue(link) {
    return link.substring(link.indexOf(enum_1.default.T_link) + 5);
}
exports.getLinkValue = getLinkValue;
function getImageValue(link) {
    if (link.indexOf(enum_1.default.images) >= 0) {
        return link.substring(link.indexOf(enum_1.default.images));
    }
    else if ((link.indexOf(enum_1.default.http) >= 0) || (link.indexOf(enum_1.default.https) >= 0)) {
        return link.substring(link.indexOf('http'));
    }
    else
        return link.substring(link.indexOf(enum_1.default.d_colon) + 2);
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
        let adoc = enum_1.default.adoc;
        let code = true;
        for (let i = 0; i < Ilinks.length; i++) {
            //anchor type
            if (Ilinks[i].indexOf(enum_1.default.hash) > 0) {
                let str = (Ilinks[i].substring(0, Ilinks[i].indexOf(enum_1.default.hash)));
                if (!(fs.existsSync(directory + str + adoc))) {
                    console.log(enum_1.default.red, linkFile[links.indexOf(Ilinks[i])] + " " + enum_1.default.arrow + directory + str + adoc + ' False', enum_1.default.white);
                    code = false;
                }
            }
            else {
                if (!(fs.existsSync(directory + Ilinks[i])) && !(fs.existsSync(directory + Ilinks[i] + enum_1.default.adoc))) {
                    code = false;
                    console.log(enum_1.default.red, linkFile[links.indexOf(Ilinks[i])] + " ---> " + directory + Ilinks[i] + ' False', enum_1.default.white);
                }
            }
        }
        return code;
    });
}
