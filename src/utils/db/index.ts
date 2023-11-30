import mysql, { ResultSetHeader } from "mysql2";

interface IDB<T> {
    get: () => Promise<T[]>,
    first: () => Promise<T | null>,
    where: (column: string, condition: "=" | ">" | "<" | ">=" | "<=" | "<>", value: any) => this,
    insert: (data: T & {}) => Promise<{
        status: boolean,
        data?: mysql.ResultSetHeader
    }>
}

const connection = mysql.createPool({
    host: "localhost",
    user: "root",
    database: "coolfake",
    waitForConnections: true,
    connectionLimit: 50
});

const promisePool = connection.promise();

export default function table<T>(tableName: string) {
    let sql: string = `SELECT * FROM ${tableName}`;
    let valueList: any[] = [];

    const query = async function(sql: string, _valueList: any[] = []) {
        const [row] = await promisePool.query(sql, _valueList.length === 0 ? valueList : _valueList);
        
        return row as T[];
    }

    const execute: IDB<T> = {
        get: async function() {
            return query(sql);
        },
        first: async function() {
            const dataList = await query(sql);
            if(dataList.length > 0)
                return dataList[0];
            return null;
        },
        where: function(column: string, condition: "=" | ">" | "<" | ">=" | "<=" | "<>", value: any) {
            sql += sql.includes("WHERE") ? " AND " : " WHERE ";
            sql += `${column} ${condition} ?`;
            valueList.push(value);
            return this;
        },
        insert: async function(data: T & {}) {
            sql = `INSERT INTO ${tableName}(__ATTRIBUTES__) VALUES(__VALUES__)`;

            const keys = Object.keys(data);
            const attributes: string[] = [];
            const values: any[] = [];

            for(const key of keys) {
                attributes.push(`\`${key}\``);

                const value = data[key as keyof typeof data];
                values.push(value);
            }

            sql = sql.replace("__ATTRIBUTES__", attributes.join(", ")).replace("__VALUES__", Array(keys.length).fill("?").join(", "));
            try {
                // console.log(sql, values.join(", "))
                const result = await query(sql, values) as unknown as ResultSetHeader;
                return {
                    status: true,
                    data: result
                };
            } catch {
                return {
                    status: false
                };
            }
        }
    }

    return execute;
}