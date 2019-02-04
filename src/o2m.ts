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

const clearOutputDir = (outputDir: string): void => {
	const files: string[] = fs.readdirSync(outputDir);
	for (const file of files) fs.unlinkSync(path.join(outputDir, file));
};

const extractTableNames = (tableNamesResponse: IExecuteReturn, exclude: string[] = []): string[] => {
	const tableNamesRows: any = tableNamesResponse.rows;
	const tableNames: string[] = _.map(tableNamesRows, name => name[0]);
	return _.filter(tableNames, (name) => !name.includes(' ') && !name.includes('$') && !_.includes(exclude, name));
};

const row2obj = (columns: string[], row: any): any => {
	const obj: any = {};
	for (const x in row) {
		if (columns.hasOwnProperty(x) && row.hasOwnProperty(x)) {
			// @ts-ignore
			obj[columns[x]] = row[x];
		}
	}
	return obj;
};

export default class O2M {
	private readonly _oracle: OracleConfigObject;
	private readonly _mongo: MongoConfigObject;
	private readonly _outputDir: string;
	private readonly _output: boolean;
	private readonly _oracleQuery: string;

	private _client: MongoClient | null = null;
	private _db: Db | null = null;

	private _verbose: boolean = false;

	constructor(oracle: OracleConfigObject, mongo: MongoConfigObject, outputDir?: string) {
		this._oracle = oracle;
		this._mongo = mongo;
		this._outputDir = outputDir || '';
		this._output = !_.isEmpty(this._outputDir);

		this._oracleQuery = "SELECT table_name FROM dba_tables WHERE owner='" + this._oracle.owner + "' ORDER BY table_name";

		if (this._output) clearOutputDir(this._outputDir);
	}

	set verbose(verbose: boolean) {
		this._verbose = verbose;
	}

	public async copy(exclude: string[] = []): Promise<O2M> {

		await this.mongoClear();
		if (!this._client) throw new Error("O2M::copy:Failed to connect to MongoDB [" + this._mongo.server + this._mongo.database + "]");
		if (!this._db) throw new Error("O2M::copy:Failed to connect to MongoDB database " + this._mongo.database);

		try {
			const connection: IConnection = await oracledb.getConnection(this._oracle);
			if (!connection) throw new Error("O2M::copy:Failed to connect to Oracle.");

			const tableNamesResponse: IExecuteReturn = await connection.execute(this._oracleQuery);
			const tableNames: string[] = extractTableNames(tableNamesResponse, exclude);

			let tableIndex: number = 0;
			const TABLE_TOTAL: number = _.size(tableNames);
			for (const table of tableNames) {
				tableIndex++;
				if (this._verbose) process.stdout.write('Processing [' + tableIndex + '/' + TABLE_TOTAL + ']' + table + '\n');

				try {
					const resultsResponse: IExecuteReturn = await connection.execute('SELECT * FROM ' + table);
					const columns: string[] = _.map(resultsResponse.metaData, d => d.name);
					const results: any = resultsResponse.rows;

					let rowIndex: number = 0;
					const ROW_TOTAL: number = _.size(results);
					for (const row of results) {
						rowIndex++;

						const obj: any = row2obj(columns, row);
						await this._db.collection(table).insertOne(obj);

						const objString: string = JSON.stringify(obj);
						if (this._output) fs.appendFileSync(this._outputDir + table + '.json', objString + '\n');
						if (this._verbose && rowIndex % 1000 === 0) process.stdout.write(' - Inserting [' + rowIndex + '/' + ROW_TOTAL + '] ' + objString.substr(0, 100) + '...\n');
					}
				} catch (err) {
					process.stdout.write(err + '\n');
				}
			}

			await this._client.close();
			await connection.close();

		} catch (err) {
			process.stdout.write(err + '\n');
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
			const collections: Collection[] = await this._db.collections();
			for (const collection of collections) await collection.drop();

		} catch (err) {
			process.stdout.write(err + '\n');
		}

		return this;
	}

}
