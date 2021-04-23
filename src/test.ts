import { expect } from "chai";
import "mocha";
import { checkLinks, fixLink, getImageValue, getLinkValue, sendRequest } from "./index";

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
        const link = "https://www.google.es";
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
});

describe("sendRequest  function", () => {
    it("should return false", (done) => {
        const link = "https://dilbert.com/404";
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
