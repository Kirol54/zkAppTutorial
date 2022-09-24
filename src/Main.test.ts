import { Main } from './Main';
import {
  isReady,
  shutdown,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Poseidon,
  // Bool,
  // Signature,
} from 'snarkyjs';

function createLocalBlockchain() {
  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  return Local.testAccounts[0].privateKey;
}

async function localDeploy(
  zkAppInstance: Main,
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

describe('Main', () => {
  let deployerAccount: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkAppInstance: Main;

  let inputValue1: Field,
    inputValue2: Field,
    expectedState1: Field,
    expectedState2: Field;

  beforeAll(async () => {
    await isReady;
    deployerAccount = createLocalBlockchain();
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkAppInstance = new Main(zkAppAddress);
    await localDeploy(zkAppInstance, zkAppPrivateKey, deployerAccount);
    await Main.compile();
  });

  afterAll(async () => {
    // `shutdown()` internally calls `process.exit()` which will exit the running Jest process early.
    // Specifying a timeout of 0 is a workaround to defer `shutdown()` until Jest is done running all tests.
    // This should be fixed with https://github.com/MinaProtocol/mina/issues/10943
    setTimeout(shutdown, 0);
  });

  it('generates and deploys the `Main` smart contract', async () => {
    const state1 = zkAppInstance.state1.get();
    expect(state1).toEqual(Field.zero);
  });

  it('correctly sets the state1 on the `Main` smart contract', async () => {
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.setState();
    });
    await txn.prove();
    await txn.send().wait();

    const updatedState1 = zkAppInstance.state1.get();
    expect(updatedState1).toEqual(Field.one);
  });
  it('correctly updates the state1 to Field(3)', async () => {
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.updateState();
    });
    await txn.prove();
    await txn.send().wait();

    const updatedState1 = zkAppInstance.state1.get();
    expect(updatedState1).toEqual(Field(3));
  });

  it('correctly updates the state1 to Field(3) times inputValue and state2 to square of state1 ', async () => {
    inputValue1 = Field(2);
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.mathOne(inputValue1);
    });
    await txn.prove();
    await txn.send().wait();

    expectedState1 = Field(3).mul(inputValue1);
    const updatedState1 = zkAppInstance.state1.get();
    expect(updatedState1).toEqual(expectedState1);

    expectedState2 = expectedState1.square();
    const updatedState2 = zkAppInstance.state2.get();
    expect(updatedState2).toEqual(expectedState2);
  });

  it('correctly updates the state mathTwo', async () => {
    inputValue2 = Field(6);
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.mathTwo(inputValue2);
    });
    await txn.prove();
    await txn.send().wait();

    const updatedState1 = zkAppInstance.state1.get();
    expect(updatedState1).toEqual(expectedState1.div(inputValue2));

    const updatedState2 = zkAppInstance.state2.get();
    expect(updatedState2).toEqual(expectedState2.sqrt());
  });
  it('correctly hashes values and updates the state', async () => {
    let inputValue3 = Field(randomNumber(1, 10000));
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.hashing(inputValue3);
    });
    await txn.prove();
    await txn.send().wait();

    const state1 = zkAppInstance.state1.get();
    const state2 = zkAppInstance.state2.get();
    const stateHash = zkAppInstance.stateHash.get();
    let expectedHash = Poseidon.hash([state1, state2, inputValue3]);

    expect(expectedHash).toEqual(stateHash);
  });
});
