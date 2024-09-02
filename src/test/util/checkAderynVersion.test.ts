import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import proxyquire from 'proxyquire';

suite('checkAderynVersion Test Suite', () => {
  let sandbox: sinon.SinonSandbox;
  let execStub: sinon.SinonStub;
  let checkAderynVersion: (aderynOutputChannel: vscode.OutputChannel) => Promise<boolean>;
  let windowShowErrorMessageStub: sinon.SinonStub;
  let envOpenExternalStub: sinon.SinonStub;
  let aderynOutputChannel: vscode.OutputChannel;

  setup(() => {
    sandbox = sinon.createSandbox();
    execStub = sandbox.stub();
    windowShowErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    envOpenExternalStub = sandbox.stub(vscode.env, 'openExternal').resolves();
    aderynOutputChannel = vscode.window.createOutputChannel('Aderyn');

    checkAderynVersion = proxyquire('../../util/checkAderynVersion', {
      'child_process': { exec: execStub },
    }).checkAderynVersion;
  });

  teardown(() => {
    sandbox.restore();
  });

  test('should return true if version is correct', async () => {
    execStub.yields(null, 'aderyn 0.2.0', '');

    const result = await checkAderynVersion(aderynOutputChannel);
    assert.strictEqual(result, true);
  });

  test('should return false and show error if aderyn is not found', async () => {
    execStub.yields(new Error('command not found'), '', '');

    const result = await checkAderynVersion(aderynOutputChannel);
    assert.strictEqual(result, false);
    assert.strictEqual(windowShowErrorMessageStub.calledOnce, true);
    assert.strictEqual(windowShowErrorMessageStub.firstCall.args[0], 'Aderyn not found. Please install aderyn.');
  });

  test('should return false and show error if version is too old', async () => {
    execStub.yields(null, 'aderyn 0.0.1', '');

    const result = await checkAderynVersion(aderynOutputChannel);
    assert.strictEqual(result, false);
    assert.strictEqual(windowShowErrorMessageStub.calledOnce, true);
    assert.strictEqual(windowShowErrorMessageStub.firstCall.args[0].includes('Aderyn version is too old.'), true);
  });
});
