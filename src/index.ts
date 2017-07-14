import * as fs from 'fs';
import * as glob from 'glob';
import * as request from 'superagent';
import Constants from './enum';
let remark = require('remark');

let directory: string;
let links: string[] = [];
let linkFile: string[] = [];
let external_links: string[] = []
let linkExternalFile: string[] = [];

/**Read each asciidoc of the directory where the wiki has been cloned and call the function    getlinks to iterate for each one.
* glob allows you to searh inside a directory all the files with a certain extension, in this case 'asciidoc'
 */
export function linkChecker(dir: string) {
    directory = dir
    glob(directory + '*' + Constants.adoc, async function (err: any, files: any) {
        files.forEach(
            function (file: any) {
                let ast = remark().parse(fs.readFileSync(file, 'utf-8'));
                let childrens: any[] = ast.children;
                childrens.forEach(child => {
                    getLinks(child).forEach(link => {
                        if (link.indexOf(Constants.http) >= 0 || link.indexOf(Constants.https) >= 0) {
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
                    })
                })
            });

        let code1 = await checkLinks(external_links);
        let code2 = await checkInternalLinks(links);
        exitCode(code1, code2)
    }
    )
}

/**Receives 2 codes(1 code for external links and 1 code for internal links, compare them and show the output*/

function exitCode(code1: boolean, code2: boolean) {

    if (code1 && code2) {
        console.log('DONE: exit code 0 ')
        process.exit();
    }
    else {
        console.log('DONE: Some link failed, exit code 1 ')
        process.exit(1);
    }

}
/**Function to do a HEAD request for the external links returning the status 
 * returns code = true if status 200 or code = false if status 404
*/
export async function sendRequest(link: string): Promise<boolean> {
    let req = link
    let response: any
    let code: boolean = true;
    return new Promise<boolean>((resolve, reject) =>
        request.
            head(req).
            end(function (err: any, res: request.Response) {
                if (res == undefined) {
                    console.log(linkExternalFile[external_links.indexOf(link)] + " " + Constants.arrow + " " + link + ' site cant be reached')
                }
                else {
                    response = res.status
                    /**Request to private repositories need autentication */
                    if (response == 404 && link.indexOf(Constants.github) >= 0) {
                        console.log(linkExternalFile[external_links.indexOf(link)] + " " + Constants.arrow + " " + link + ' cannot be verified')
                    }
                    else {
                        if (response == 404) {
                            console.log(Constants.red, linkExternalFile[external_links.indexOf(link)] + " " + Constants.arrow + " " + link + " " + Constants.arrow + " " + response, Constants.white)
                            resolve(false);
                            return;
                        }
                    }
                }

                resolve(true);
            }
            ))
}

/**Recursively get the links from the AST and push them into an array, there are 2 types of link(external and internal) and each one have one array */

function getLinks(childOfChild: any): string[] {
    let links: string[] = [];
    if (childOfChild.children) {
        let childrenNew: any[] = childOfChild.children;
        childrenNew.forEach(subChild => {
            if (subChild.type) {
                switch (subChild.type) {
                    case 'link':
                        if (subChild.url.indexOf(Constants.localhost) >= 0) {
                            break;
                        }
                        links.push(fixLink(subChild.url));
                        break;
                    case 'text':
                        /**there are some special characters that need to be checked */
                        if ((<string>subChild.value).endsWith(Constants.d_plus)) {
                            break;
                        }
                        let str = subChild.value
                        if (str.indexOf(Constants.T_link) >= 0) {
                            if (str.startsWith(Constants.d_slash) == false) {
                                links.push(getLinkValue(str))
                            }
                        }
                        else if ((str.indexOf(Constants.image) >= 0) && (str.startsWith(Constants.d_slash) == false)) {
                            if (str.endsWith(Constants.brackets)) {
                                str = str.substring(0, str.lastIndexOf(Constants.bracket))
                            }
                            links.push(getImageValue(str))
                        }
                    default:
                        return getLinks(subChild);
                }
            }
        })
    }
    return links;
}

/**There are some links wich end with some extra character and need to be fixed */

export function fixLink(link: string) {

    if (link.indexOf(Constants.bracket) >= 0) {
        return link.substring(0, link.indexOf(Constants.bracket));

    }
    else if (link.indexOf(Constants.quote) > 0) {
        return link.substring(0, link.indexOf(Constants.quote));
    }
    else if (link.indexOf(Constants.d_quote) > 0) {
        return link.substring(0, link.indexOf(Constants.d_quote));
    }
    else return link;
}
/**The value of those links in the AST with type 'link' are getting here */

export function getLinkValue(link: string) {

    return link.substring(link.indexOf(Constants.T_link) + 5)
}

export function getImageValue(link: string) {

    if (link.indexOf(Constants.images) >= 0) {
        return link.substring(link.indexOf(Constants.images))
    }
    else if ((link.indexOf(Constants.http) >= 0) || (link.indexOf(Constants.https) >= 0)) {
        return link.substring(link.indexOf('http'))
    }
    else return link.substring(link.indexOf(Constants.d_colon) + 2)
}

/**Verify the links */
async function checkLinks(eLinks: string[]) {

    if (eLinks.length === 0) process.exit(1);
    let code = await Promise.all(eLinks.map(sendRequest));
    return code.reduce((a, b) => a && b);
}

/**There are 2 types of InternalLinks, anchor types(#) and resource types(/) */
async function checkInternalLinks(Ilinks: string[]) {
    let adoc = Constants.adoc;
    let code = true;
    for (let i = 0; i < Ilinks.length; i++) {
        //anchor type
        if (Ilinks[i].indexOf(Constants.hash) > 0) {
            let str = (Ilinks[i].substring(0, Ilinks[i].indexOf(Constants.hash)))
            if (!(fs.existsSync(directory + str + adoc))) {
                console.log(Constants.red, linkFile[links.indexOf(Ilinks[i])] + " "+ Constants.arrow + directory + str + adoc + ' False', Constants.white)
                code = false
            }
        }
        //resource type
        else {

            if (!(fs.existsSync(directory + Ilinks[i])) && !(fs.existsSync(directory + Ilinks[i] + Constants.adoc))) {
                code = false;
                console.log(Constants.red, linkFile[links.indexOf(Ilinks[i])] + " ---> " + directory + Ilinks[i] + ' False', Constants.white)

            }
        }
    }
    return code;
}
