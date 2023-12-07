"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class Http {
    static _fetch(method, url, config, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return axios_1.default[method](url, method === "get" ? config : data, method == "post" ? data : undefined)
                .then(data => data.data);
        });
    }
    static get(url, config) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._fetch("get", url, config);
        });
    }
    static getCatch(url, config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return [yield this.get(url, config), undefined];
            }
            catch (err) {
                return [undefined, err];
            }
        });
    }
}
exports.default = Http;
