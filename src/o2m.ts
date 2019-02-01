#!/usr/bin/env node
"use strict";

import * as fs from 'fs';
import * as path from 'path';

import * as _ from 'lodash';
import * as oracledb from 'oracledb';
import {MongoClient, Db, Collection} from 'mongodb';
import {IConnection} from "oracledb";
import {IExecuteReturn} from "oracledb";

export type OracleConfigObject = { user: string, password: string, connectString: string, owner: string };
export type MongoConfigObject = { database: string, server: string };

export default class O2M {
	private readonly _oracle: OracleConfigObject;
	private readonly _mongo: MongoConfigObject;
	private readonly _outputDir: string;
	private readonly _output: boolean;
	private readonly _oracleQuery: string;

	private _client: MongoClient | null = null;
	private _db: Db | null = null;

	constructor(oracle: OracleConfigObject, mongo: MongoConfigObject, outputDir?: string) {
		this._oracle = oracle;
		this._mongo = mongo;
		this._outputDir = outputDir || '';
		this._output = !_.isEmpty(this._outputDir);

		this._oracleQuery = "SELECT table_name FROM dba_tables WHERE owner='" + this._oracle.owner + "' ORDER BY table_name";

		if (this._output) {
			let files: string[] = fs.readdirSync(this._outputDir);
			for (const file of files) fs.unlinkSync(path.join(this._outputDir, file));
		}
	}

	public async copy(): Promise<O2M> {
		await this.mongoClear();
		if (!this._client) throw new Error("O2M::copy:Failed to connect to MongoDB [" + this._mongo.server + this._mongo.database + "]");
		if (!this._db) throw new Error("O2M::copy:Failed to connect to MongoDB database " + this._mongo.database);

		try {
			let connection: IConnection = await oracledb.getConnection(this._oracle);
			if (!connection) throw new Error("O2M::copy:Failed to connect to Oracle.");

			let tableNamesResponse: IExecuteReturn = await connection.execute(this._oracleQuery);
			let tableNamesRows: any = tableNamesResponse.rows;
			let tableNames: string[] = _.map(tableNamesRows, name => name[0]);
			tableNames = _.filter(tableNames, name => !name.includes(' ') && !name.includes('$'));

			let tableIndex: number = 0;
			const TABLE_TOTAL: number = _.size(tableNames);
			for (let tablesRow of tableNames) {
				tableIndex++;

				let table: string = tablesRow;
				console.log('Processing [' + tableIndex + '/' + TABLE_TOTAL + '] ' + table);

				let resultsResponse: IExecuteReturn = await connection.execute('SELECT * FROM ' + table);
				let column: string[] = _.map(resultsResponse.metaData, d => d.name);
				let results: any = resultsResponse.rows;

				let rowIndex: number = 0;
				const ROW_TOTAL: number = _.size(results);
				for (let row of results) {
					rowIndex++;
					let obj: any = {};

					for (let i in row) {
						if (column.hasOwnProperty(i) && row.hasOwnProperty(i)) {
							// @ts-ignore
							obj[column[i]] = row[i];
						}
					}

					await this._db.collection(table).insertOne(obj);

					let objString: string = JSON.stringify(obj);
					fs.appendFileSync('./OUT/' + table + '.json', objString + '\n');

					if (rowIndex % 1000 === 0) console.log(' - Inserting [' + rowIndex + '/' + ROW_TOTAL + '] ' + objString.substr(0, 100) + '...');
				}
			}

			await this._client.close();
			await connection.close();

		} catch (err) {
			console.error(err.message);
		}

		return this;
	}

	private async mongoConnect(): Promise<Db> {
		if (this._db) return this._db;

		this._client = await MongoClient.connect(this._mongo.server);
		this._db = this._client.db(this._mongo.database);
		return this._db;
	}

	private async mongoClear(): Promise<O2M> {
		try {
			this._db = await this.mongoConnect();
			let collections: Collection[] = await this._db.collections();
			for (let collection of collections) await collection.drop();

		} catch (err) {
			console.error(err);

		} finally {
			return this;
		}
	}

}
