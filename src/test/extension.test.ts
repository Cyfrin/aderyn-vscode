import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as kvstore from '../kvstore';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Key Value store', () => {
		const kvStore = new kvstore.KVStore('aderyn-vs-code-tests.json');
		kvStore.set('/absolute/path/to/project1', {
			scope: "src/",
			exclude: "lib/",
		});
		assert.strictEqual(kvStore.get('/absolute/path/to/project1').scope, 'src/');

		kvStore.set('/absolute/path/to/project2', {});
		assert.strictEqual(kvStore.get('/absolute/path/to/project2').scope, undefined);
	});

});
