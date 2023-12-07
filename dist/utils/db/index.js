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
const mysql2_1 = __importDefault(require("mysql2"));
const connection = mysql2_1.default.createPool({
    host: "localhost",
    user: "root",
    database: "coolfake",
    waitForConnections: true,
    connectionLimit: 50
});
const promisePool = connection.promise();
function table(tableName) {
    let sql = `SELECT * FROM ${tableName}`;
    let valueList = [];
    const query = function (sql, _valueList = []) {
        return __awaiter(this, void 0, void 0, function* () {
            const [row] = yield promisePool.query(sql, _valueList.length === 0 ? valueList : _valueList);
            return row;
        });
    };
    const execute = {
        get: function () {
            return __awaiter(this, void 0, void 0, function* () {
                return query(sql);
            });
        },
        first: function () {
            return __awaiter(this, void 0, void 0, function* () {
                const dataList = yield query(sql);
                if (dataList.length > 0)
                    return dataList[0];
                return null;
            });
        },
        where: function (column, condition, value) {
            sql += sql.includes("WHERE") ? " AND " : " WHERE ";
            sql += `${column} ${condition} ?`;
            valueList.push(value);
            return this;
        },
        insert: function (data) {
            return __awaiter(this, void 0, void 0, function* () {
                sql = `INSERT INTO ${tableName}(__ATTRIBUTES__) VALUES(__VALUES__)`;
                const keys = Object.keys(data);
                const attributes = [];
                const values = [];
                for (const key of keys) {
                    attributes.push(`\`${key}\``);
                    const value = data[key];
                    values.push(value);
                }
                sql = sql.replace("__ATTRIBUTES__", attributes.join(", ")).replace("__VALUES__", Array(keys.length).fill("?").join(", "));
                try {
                    // console.log(sql, values.join(", "))
                    const result = yield query(sql, values);
                    return {
                        status: true,
                        data: result
                    };
                }
                catch (_a) {
                    return {
                        status: false
                    };
                }
            });
        }
    };
    return execute;
}
exports.default = table;
