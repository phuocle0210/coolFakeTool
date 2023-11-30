import axios, { AxiosRequestConfig } from "axios";

export default class Http {
    private static async _fetch(method: "get" | "post", url: string, config?: AxiosRequestConfig, data?: any) {
        return axios[method](url, method === "get" ? config : data, method == "post" ? data : undefined)
        .then(data => data.data);
    }

    public static async get(url: string, config?: AxiosRequestConfig) {
        return this._fetch("get", url, config);
    }

    public static async getCatch(url: string, config?: AxiosRequestConfig) {
        try {
            return [await this.get(url, config), undefined];
        } catch(err) {
            return [undefined, err];
        }
    }
}