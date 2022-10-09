import { Second } from './Second';
import {
  isReady,
  shutdown,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Signature,
} from 'snarkyjs';

function createLocalBlockchain() {
  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  return Local.testAccounts;
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
  let testAccounts: { publicKey: PublicKey; privateKey: PrivateKey }[],
    deployerAccount: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkAppInstance: Second,
    randomValue: Array<number>;

  beforeAll(async () => {
    await isReady;
    testAccounts = createLocalBlockchain();
    deployerAccount = testAccounts[0].privateKey;
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
    randomValue = [
      randomNumber(8, 50),
      randomNumber(51, 100),
      randomNumber(1, 7),
    ];
    for (let i = 0; i < randomValue.length; i++) {
      let inputValue3 = Field(randomValue[i]);
      const txn = await Mina.transaction(deployerAccount, () => {
        zkAppInstance.boolMethods(inputValue3);
      });
      await txn.prove();
      await txn.send().wait();
      let updatedBoolA = zkAppInstance.BoolA.get();
      expect(updatedBoolA.toBoolean()).toEqual(randomValue[i] > 8);

      let updatedBoolB = zkAppInstance.BoolB.get();
      expect(updatedBoolB.toBoolean()).toEqual(
        randomValue[i] <= 50 && randomValue[i] > 8
      );
    }
  });
  it('correctly verifies the user', async () => {
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.setUser(deployerAccount);
    });
    await txn.prove();
    await txn.send().wait();

    const updatedUserState = zkAppInstance.userAddr.get();
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

    const updatedUserState = zkAppInstance.userAddr.get();
    expect(updatedUserState).toEqual(deployerAccount.toPublicKey());
  });
  it('fails with incorrect user ', async () => {
    let valueX = Field(999);
    let signature = Signature.create(testAccounts[1].privateKey, [valueX]);
    let error = '';
    try {
      const txn = await Mina.transaction(testAccounts[1].privateKey, () => {
        zkAppInstance.signature(valueX, signature);
      });
      await txn.prove();
    } catch (e: any) {
      error = e.message;
    }
    expect(error).toEqual('assert_equal: 0 != 1');
  });
  it('correctly sets conditional state', async () => {
    const boolBState = zkAppInstance.BoolB.get();
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.conditional();
    });
    await txn.prove();
    await txn.send().wait();
    const conditionalState = zkAppInstance.conditionalState.get();
    if (boolBState.toBoolean()) {
      expect(conditionalState).toEqual(Field.one);
    } else {
      expect(conditionalState).toEqual(Field(1337));
    }
  });
});
