import { expect } from "chai";
import "mocha";
import parseFileForLinks, { getLinks, fixLink, getLinkValue } from "./parser";
import { sendRequest } from "./external_link_checker";
import { Link, LinkCheckResult } from "./model";
import { checkInternalLinks } from "./internal_link_checker";
import { checkAllLinksInDirectory } from "./index";
import Constants from "./constants";

describe("fixLink function", () => {
    it("should return true", () => {
        const link: string[] = [
            "https://www.google.es[here",
            "https://www.google.es'",
            'https://www.google.es"',
        ];
        const result1 = fixLink(link[0]);
        const result2 = fixLink(link[1]);
        const result3 = fixLink(link[2]);
        const r1 = result1 === result2 && result2 === result3;
        expect(r1).true;
    });
});

describe("getLinkValue function", () => {
    it("should return https://www.google.es", () => {
        const link: string = "link:https://www.google.es";
        const result = getLinkValue(link, Constants.tLink, "");
        expect(result).equal("https://www.google.es");
    });

});

describe("getImageValue function", () => {
    it("should return true true true true", () => {
        const link: string[] = [
            "image::images/test.PNG[]",
            "image::https://www.google.es[]",
            "image::http://www.google.es[]",
            "image::test.PNG[]",
        ];
        const r0 = getLinkValue(link[0], Constants.tImage, "");
        const r1 = getLinkValue(link[1], Constants.tImage, "");
        const r2 = getLinkValue(link[2], Constants.tImage, "");
        const r3 = getLinkValue(link[3], Constants.tImage, "");
        expect(r0).equal("images/test.PNG");
        expect(r1).equal("https://www.google.es");
        expect(r2).equal("http://www.google.es");
        expect(r3).equal("test.PNG");
    });

});

describe("sendRequest  function", () => {
    it("should return true", (done) => {
        const link = new Link("https://www.google.es", "", Constants.tLink);
        sendRequest(link).then((res) => {
            try {
                expect(res, `Link can be accessed ${link.value}`).to.be.true;
                done();
            } catch (err) {
                done(err);
            }
        }, (err) => {
            done(err);
        });

    });
    it("should return true", (done) => {
        const link = new Link("https://marketplace.visualstudio.com", "", Constants.tLink);
        sendRequest(link).then((res) => {
            try {
                expect(res, `Link can be accessed ${link.value}`).to.be.true;
                done();
            } catch (err) {
                done(err);
            }
        }, (err) => {
            done(err);
        });

    });
    it("should return false", (done) => {
        const link = new Link("https://dilbert.com/404", "", Constants.tLink);
        sendRequest(link).then((res) => {
            try {
                expect(res, `Link can be accessed ${link.value}`).to.be.false;
                done();
            } catch (err) {
                done(err);
            }
        }, (err) => {
            done(err);
        });

    });
});

describe("getLinks  function", () => {
    it("should all recursively included links", (done) => {
        const astChild: any = {
            type: "paragraph",
            children: [
                {
                    type: "link",
                    url: "http://example.com"
                },
                {
                    type: "list",
                    children: [
                        {
                            type: "text",
                            value: " link:internal_dir/test.adoc"
                        },
                        {
                            type: "text",
                            value: " link:internal_dir/test2.adoc"
                        }
                    ]
                },
            ]

        };

        const links = getLinks(astChild, "");
        expect(links).to.have.deep.members([
            new Link("http://example.com", "", Constants.tLink), 
            new Link("internal_dir/test.adoc", "", Constants.tLink),  
            new Link("internal_dir/test2.adoc", "", Constants.tLink)
        ]);
        done();
    });
});

describe("checkInternalLinks function", () => {
    it("should check all links enforcing xref", (done) => {
        const links = [new Link("subdir/sub_article.adoc","test_wiki/index.adoc", Constants.tLink)
            , new Link("subdir/sub_article.adoc","test_wiki/index.adoc", Constants.tXref)];
        checkInternalLinks(links, true).then(result => {
            expect(result.totalNo).to.equal(2);
            expect(result.invalidNo).to.equal(1);
            done();
        }).catch(err => done(err));
    });
    it("should not report errors for using linkage to adoc", (done) => {
        const links = [new Link("subdir/sub_article.adoc","test_wiki/index.adoc", Constants.tLink)];
        checkInternalLinks(links, false).then(result => {
            expect(result.totalNo).to.equal(1);
            expect(result.invalidNo).to.equal(0);
            done();
        }).catch(err => done(err));
    });
    it("should not report errors for xref anchors", (done) => {
        const links = [new Link("anchor_text","test_wiki/index.adoc", Constants.tXref)];
        checkInternalLinks(links, false).then(result => {
            expect(result.totalNo).to.equal(1);
            expect(result.invalidNo).to.equal(0);
            done();
        }).catch(err => done(err));
    });
});

describe("parseFileForLinks function", () => {
    it("should get all links from the main content", (done) => {
        let internalLinks : Link[] = [];
        let externalLinks : Link[] = [];
        const file = "test_wiki/index.adoc";
        parseFileForLinks(file, internalLinks, externalLinks);
        expect(externalLinks).that.is.empty;
        expect(internalLinks).to.have.deep.members([
            new Link("subdir/sub_article.adoc", file, Constants.tLink),
            new Link("subdir/sub_article.adoc", file, Constants.tXref)
        ]);
        done();
    });
    it("should get all links from a unordered list of texts", (done) => {
        let internalLinks : Link[] = [];
        let externalLinks : Link[] = [];
        const file = "test_wiki/subdir/sub_article.adoc";
        parseFileForLinks(file, internalLinks, externalLinks);
        expect(externalLinks, "two external links").to.have.deep.members([
            new Link("http://google.com", file, Constants.tLink),
            new Link("http://microsoft.com", file, Constants.tLink)
        ]);
        expect(internalLinks, "one internal links").to.have.deep.members([
            new Link("../index.adoc", file, Constants.tXref)
        ]);
        done();
    });
});

describe("linkChecker function", () => {

    // TODO handle async correctly
    it("should report no error when not enforcing xref", (done) => {
        checkAllLinksInDirectory("test_wiki/", false, (resultPromise) => {
            resultPromise.then( result => {
                expect(result[0].invalidNo).to.eq(0);
                expect(result[0].totalNo).to.eq(2);
                expect(result[0].validNo).to.eq(2);
                expect(result[1].invalidNo).to.eq(0);
                expect(result[1].totalNo).to.eq(3);
                expect(result[1].validNo).to.eq(3);
                done();
            }).catch(err => done(err));
        });
    });
    it("should report one error when enforcing xref", (done) => {
        checkAllLinksInDirectory("test_wiki/", true, (resultPromise) => {
            resultPromise.then( result => {
                expect(result[0].invalidNo).to.eq(0);
                expect(result[0].totalNo).to.eq(2);
                expect(result[0].validNo).to.eq(2);
                expect(result[1].invalidNo).to.eq(1);
                expect(result[1].totalNo).to.eq(3);
                expect(result[1].validNo).to.eq(2);
                done();
            }).catch(err => done(err));
        });
    });
});
