import * as cheerio from "cheerio";
export type IHTMLCallBack<T> = ($: cheerio.CheerioAPI, element: cheerio.AnyNode, index: number) => T;
export default class HTML {
    private $;
    constructor(html: string);
    each<T>(element: string, fn: IHTMLCallBack<T>): T[];
    find<T>(element: cheerio.AnyNode, name: string, fn: IHTMLCallBack<T>): T[];
}
