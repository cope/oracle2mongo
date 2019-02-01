#!/usr/bin/env node
'use strict';

import {expect} from 'chai';
import O2M from "../src/o2m";

const mongo = {
	database: 'dummy',
	server: 'mongodb://localhost:27017/'
};

const oracle = {
	user: "dummy",
	password: "dummy",
	connectString: "dummy:1521/dummy",
	owner: "dummy"
};

describe('O2M tests', () => {

	describe('O2M constructors test', () => {
		it('constructors should work', () => {
			expect(() => new O2M(oracle, mongo)).to.not.throw();
		});
	});

});
