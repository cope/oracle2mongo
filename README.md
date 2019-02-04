<a href='http://stojadinovic.net'>
  <img alt='Predrag Stojadinovic' src='https://en.stojadinovic.net/assets/images/logo-128x128-88.jpg' width='100'>
</a>

# oracle2mongo
[![build status](https://img.shields.io/travis/cope/oracle2mongo.svg?branch=master)](https://travis-ci.org/cope/oracle2mongo)
[![codacy](https://img.shields.io/codacy/grade/07b287618ee8467da981a039baea0b10.svg)](https://www.codacy.com/project/cope/oracle2mongo/dashboard)
[![dependencies](https://david-dm.org/cope/oracle2mongo.svg)](https://www.npmjs.com/package/oracle2mongo)
[![npm](https://img.shields.io/npm/dt/oracle2mongo.svg)](https://www.npmjs.com/package/oracle2mongo)

Quick Oracle 2 Mongo copy

## Documentation

[TypeDoc documentation](https://cope.github.io/oracle2mongo/docs/)

## Usage

### ES6
	const O2M = require('oracle2mongo').default;

### TypeScript
	import O2M from 'oracle2mongo';

#### ES6 and TypeScript	cont.
	// all attributes are *required*
	const mongo = {
		database: '<mongodb-database-name>',
		server: 'mongodb://localhost:27017/'
	};

	// all attributes are *required*
	const oracle = {
		user: '<oracle-username>',
		password: '<oracle-password>',
		connectString: '<oracle-host>:<oracle-port>/<oracle-service-or-sid>',
		owner: '<oracle-owner>'
	};

	// output dir is optional - if passed, there will be a json file per oracle table created, with all data
	const outputDir = '<somewhere>/<someDir>';

	// exclude array is optional - if passed, tables listed in the array will be excluded from copy
	const exclude = ['some_table', 'other_table'];

	new O2M(oracle, mongo, outputDir)
		.verbose()		// <- optional
		.copy(exclude)
		.then(() => true)
		.catch(err => console.error);
