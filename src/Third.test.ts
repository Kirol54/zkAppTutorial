import { Third } from './Third';
import {
  isReady,
  shutdown,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  // Bool,
  //   Signature,
} from 'snarkyjs';

function createLocalBlockchain() {
  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  return Local.testAccounts;
}

async function localDeploy(
  zkAppInstance: Third,
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
// function randomNumber(min: number, max: number) {
//   return Math.floor(Math.random() * (max - min) + min);
// }

describe('Third', () => {
  let testAccounts: { publicKey: PublicKey; privateKey: PrivateKey }[],
    deployerAccount: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkAppInstance: Third;

  beforeAll(async () => {
    await isReady;
    testAccounts = createLocalBlockchain();
    deployerAccount = testAccounts[0].privateKey;
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkAppInstance = new Third(zkAppAddress);
    await localDeploy(zkAppInstance, zkAppPrivateKey, deployerAccount);
    await Third.compile();
  });

  afterAll(async () => {
    // `shutdown()` internally calls `process.exit()` which will exit the running Jest process early.
    // Specifying a timeout of 0 is a workaround to defer `shutdown()` until Jest is done running all tests.
    // This should be fixed with https://github.com/MinaProtocol/mina/issues/10943
    setTimeout(shutdown, 0);
  });
  it('generates and deploys the `Third` smart contract', async () => {
    const counter = zkAppInstance.counter.get();
    expect(counter).toEqual(Field.zero);
  });
  it('correctly deposits Mina to the smart contract', async () => {});
  it('correctly transfers Mina to the caller ', async () => {});
});
