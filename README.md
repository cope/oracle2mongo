<a href="http://stojadinovic.net">
  <img alt="Predrag Stojadinovic" src="https://en.stojadinovic.net/assets/images/logo-128x128-88.jpg" width="100">
</a>

# oracle2mongo
[![build status](https://img.shields.io/travis/prefko/oracle2mongo.svg?branch=master)](https://travis-ci.org/prefko/oracle2mongo)
[![codacy](https://img.shields.io/codacy/grade/07b287618ee8467da981a039baea0b10.svg)](https://www.codacy.com/project/prefko/oracle2mongo/dashboard)
[![dependencies](https://david-dm.org/prefko/oracle2mongo.svg)](https://www.npmjs.com/package/oracle2mongo)
[![npm](https://img.shields.io/npm/dt/oracle2mongo.svg)](https://www.npmjs.com/package/oracle2mongo)

preferans player paper

### Documentation

[TypeDoc documentation](https://prefko.github.io/oracle2mongo/docs/)

### Usage

	import O2M from "./src/o2m";
	
	const mongo = {
		database: '<mongodb-database-name>',
		server: 'mongodb://localhost:27017/'
	};
	
	const oracle = {
		user: "<oracle-username>",
		password: "<oracle-password>",
		connectString: "<oracle-host>:<oracle-port>/<oracle-service-or-sid>",
		owner: "<oracle-owner>"
	};
	
	new O2M(oracle, mongo).copy()
		.then(() => true)
		.catch(err => console.error);
