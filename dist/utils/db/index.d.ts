import mysql from "mysql2";
interface IDB<T> {
    get: () => Promise<T[]>;
    first: () => Promise<T | null>;
    where: (column: string, condition: "=" | ">" | "<" | ">=" | "<=" | "<>", value: any) => this;
    insert: (data: T & {}) => Promise<{
        status: boolean;
        data?: mysql.ResultSetHeader;
    }>;
}
export default function table<T>(tableName: string): IDB<T>;
export {};
