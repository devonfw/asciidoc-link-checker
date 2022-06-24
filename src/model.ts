
/** Class representing one found link in a source file */
export class Link {
    constructor(public value: string, public sourceFile: string) {}
}


export class LinkCheckResult {
    public validNo: number;
    constructor(public totalNo: number, public invalidNo: number) {
        this.validNo = totalNo - invalidNo;
    }
}

export default Link;