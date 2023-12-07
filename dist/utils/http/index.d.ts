import { AxiosRequestConfig } from "axios";
export default class Http {
    private static _fetch;
    static get(url: string, config?: AxiosRequestConfig): Promise<any>;
    static getCatch(url: string, config?: AxiosRequestConfig): Promise<any[]>;
}
