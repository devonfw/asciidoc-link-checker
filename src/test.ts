import { expect } from "chai";
import "mocha";
import { getLinks, fixLink, getImageValue, getLinkValue } from "./parser";
import { sendRequest } from "./external_link_checker";
import { Link } from "./model";
import { checkInternalLinks } from "./internal_link_checker";

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
        const result = getLinkValue(link);
        expect(result).equal("https://www.google.es");
    });

});

describe("getImageValue function", () => {
    it("should return true true true true", () => {
        const link: string[] = [
            "image::images/test.PNG",
            "image::https://www.google.es",
            "image::http://www.google.es",
            "image::test.PNG",
        ];
        const r0 = getImageValue(link[0]);
        const r1 = getImageValue(link[1]);
        const r2 = getImageValue(link[2]);
        const r3 = getImageValue(link[3]);
        expect(r0).equal("images/test.PNG");
        expect(r1).equal("https://www.google.es");
        expect(r2).equal("http://www.google.es");
        expect(r3).equal("test.PNG");
    });

});

describe("sendRequest  function", () => {
    it("should return true", (done) => {
        const link = new Link("https://www.google.es", "");
        sendRequest(link).then((res) => {
            try {
                expect(res).to.be.true;
                done();
            } catch (err) {
                done(err);
            }
        }, (err) => {
            done(err);
        });

    });
    it("should return false", (done) => {
        const link = new Link("https://dilbert.com/404", "");
        sendRequest(link).then((res) => {
            try {
                expect(res).to.be.false;
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

        const links = getLinks(astChild);
        expect(links).to.have.members(["http://example.com", "internal_dir/test.adoc", "internal_dir/test2.adoc"]);
        done();
    });
});

describe("checkInternalLinks function", () => {
    it("should check all links based on HTML extension", (done) => {
        const links = [new Link("subdir/sub_article.html","test_wiki/html_based/index.adoc")
            , new Link("subdir/sub_article.adoc","test_wiki/html_based/index.adoc")];
        checkInternalLinks(links, true).then(result => {
            expect(result.totalNo).to.equal(2);
            expect(result.invalidNo).to.equal(1);
            done();
        }).catch(err => done(err));
    });
    it("should check report errors for HTML extension without passing true", (done) => {
        const links = [new Link("subdir/sub_article.html","test_wiki/html_based/index.adoc")];
        checkInternalLinks(links, false).then(result => {
            expect(result.totalNo).to.equal(1);
            expect(result.invalidNo).to.equal(1);
            done();
        }).catch(err => done(err));
    });
});