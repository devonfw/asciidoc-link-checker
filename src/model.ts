import Constants from "./constants";

/** Class representing one found link in a source file */
export class Link {
    public external: boolean;
    constructor(public value: string, public sourceFile: string, public tag: string) {
        this.external = tag === Constants.tLink && value.indexOf(Constants.http) >= 0 || value.indexOf(Constants.https) >= 0
    }
}

export class LinkCheckResult {
    public validNo: number;
    constructor(public totalNo: number, public invalidNo: number) {
        this.validNo = totalNo - invalidNo;
    }
}

export default Link;