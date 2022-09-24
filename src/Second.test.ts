import { Second } from './Second';
import {
  isReady,
  shutdown,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  // Bool,
  Signature,
} from 'snarkyjs';

function createLocalBlockchain() {
  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  return Local.testAccounts[0].privateKey;
}

async function localDeploy(
  zkAppInstance: Second,
  zkAppPrivatekey: PrivateKey,
  deployerAccount: PrivateKey
) {
  const txn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    zkAppInstance.deploy({ zkappKey: zkAppPrivatekey });
    zkAppInstance.sign(zkAppPrivatekey);
  });
  await txn.send().wait();
}
function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

describe('Second', () => {
  let deployerAccount: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkAppInstance: Second,
    randomValue: number;

  beforeAll(async () => {
    await isReady;
    deployerAccount = createLocalBlockchain();
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkAppInstance = new Second(zkAppAddress);
    await localDeploy(zkAppInstance, zkAppPrivateKey, deployerAccount);
    await Second.compile();
  });

  afterAll(async () => {
    // `shutdown()` internally calls `process.exit()` which will exit the running Jest process early.
    // Specifying a timeout of 0 is a workaround to defer `shutdown()` until Jest is done running all tests.
    // This should be fixed with https://github.com/MinaProtocol/mina/issues/10943
    setTimeout(shutdown, 0);
  });

  it('generates and deploys the `Second` smart contract', async () => {
    const stateBool = zkAppInstance.BoolA.get();
    expect(stateBool.toBoolean()).toEqual(false);
  });
  // check values outside the range
  it('correctly updates the state boolMethods', async () => {
    // need to make it random
    randomValue = randomNumber(8, 50);
    console.log('random value: ', randomValue);
    let inputValue3 = Field(randomValue);
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.boolMethods(inputValue3);
    });
    await txn.prove();
    await txn.send().wait();
    const updatedBoolA = zkAppInstance.BoolA.get();
    expect(updatedBoolA.toBoolean()).toEqual(randomValue > 8);

    const updatedBoolB = zkAppInstance.BoolB.get();
    expect(updatedBoolB.toBoolean()).toEqual(randomValue <= 50);
  });
  it('correctly verifies the user', async () => {
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.verifyUser(deployerAccount);
    });
    await txn.prove();
    await txn.send().wait();

    const updatedUserState = zkAppInstance.user.get();
    expect(updatedUserState).toEqual(deployerAccount.toPublicKey());
  });
  it('correctly verifies the user signature', async () => {
    let valueX = Field(999);
    let signature = Signature.create(deployerAccount, [valueX]);
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.signature(valueX, signature);
    });
    await txn.prove();
    await txn.send().wait();

    const updatedUserState = zkAppInstance.user.get();
    expect(updatedUserState).toEqual(deployerAccount.toPublicKey());
  });
  //it fails to verify incorrect user
  it('correctly sets conditional state', async () => {
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.conditional();
    });
    await txn.prove();
    await txn.send().wait();
    const conditionalState = zkAppInstance.conditionalState.get();
    expect(conditionalState).toEqual(Field.one);
  });
});
