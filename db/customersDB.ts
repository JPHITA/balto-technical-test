import { open, Database as sqliteDB } from "sqlite";
import sqlite3 from "sqlite3";
import fs from "fs";


export class Database{
    private static DB: sqliteDB<sqlite3.Database, sqlite3.Statement> | null = null;

    public static async init(){
        if (!this.DB) {
            this.DB = await open({
                filename: "./db/database.db",
                driver: sqlite3.Database
            });
        
            // create the tables if they don't exist
            await this.DB.exec(fs.readFileSync("./db/schema.sql", "utf8"));
        }

        return this.DB;
    }

    public static close(){
        if (this.DB) this.DB.close();
    }
}

