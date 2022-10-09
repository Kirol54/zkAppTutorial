import { Third } from './Third';
import {
  isReady,
  shutdown,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  Account,
  UInt64,
  Bool,
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
    const counter = zkAppInstance.inboundCounter.get();
    expect(counter).toEqual(new UInt64(Field.zero));
  });
  it('correctly deposits Mina to the smart contract', async () => {
    let caller = testAccounts[1].privateKey;
    let amount = new UInt64(Field(1337));
    let balanceBefore = new UInt64(Account(zkAppAddress).balance.get().value);

    const txn = await Mina.transaction(caller, () => {
      AccountUpdate.createSigned(caller).balance.subInPlace(amount);
      zkAppInstance.sendMina(amount);
    });
    await txn.prove();
    await txn.send().wait();

    let balanceAfter = new UInt64(Account(zkAppAddress).balance.get().value);

    expect(balanceAfter).toEqual(balanceBefore.add(amount));
  });
  it('correctly transfers Mina to the reciver ', async () => {
    let latestDrainer = zkAppInstance.drainer.get();
    expect(latestDrainer.isEmpty()).toEqual(Bool(true));
    let reciver = testAccounts[1].privateKey;
    let reciverAddr = reciver.toPublicKey();
    let amount = new UInt64(Field(1337));
    let balanceBefore = new UInt64(Account(reciverAddr).balance.get().value);

    const txn = await Mina.transaction(reciver, () => {
      AccountUpdate.create(reciverAddr).balance.addInPlace(amount);
      zkAppInstance.withdrawMina(reciverAddr, amount);
    });
    await txn.prove();
    await txn.send().wait();

    let balanceAfter = new UInt64(Account(reciverAddr).balance.get().value);

    expect(balanceAfter).toEqual(balanceBefore.add(amount));
  });
});
