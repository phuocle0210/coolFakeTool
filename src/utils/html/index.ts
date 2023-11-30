import * as cheerio from "cheerio";

export type IHTMLCallBack<T> = ($: cheerio.CheerioAPI, element: cheerio.AnyNode, index: number) => T

export default class HTML {
    private $: cheerio.CheerioAPI;

    constructor(html: string) {
        this.$ = cheerio.load(html);
    }

    public each<T>(element: string, fn: IHTMLCallBack<T>): T[] {
        const resultList: T[] = [];
        this.$(element).each((index, el) => {
            resultList.push(fn(this.$, el, index));
        });
        return resultList;
    }

    public find<T>(element: cheerio.AnyNode, name: string, fn: IHTMLCallBack<T>): T[] {
        const resultList: T[] = [];
        this.$(element).find(name).each((index, el) => {
            resultList.push(fn(this.$, el, index));
        });
        return resultList;
    }
}