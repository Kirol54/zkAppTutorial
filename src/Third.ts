import {
  Bool,
  PrivateKey,
  PublicKey,
  Field,
  SmartContract,
  method,
  DeployArgs,
  Permissions,
  AccountUpdate,
  UInt64,
  State,
  state,
} from 'snarkyjs';

export class Third extends SmartContract {
  @state(Field) counter = State<Field>();
  @state(PublicKey) drainer = State<PublicKey>();

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
      receive: Permissions.proofOrSignature(),
      send: Permissions.proofOrSignature(),
    });
  }
  @method depositMina(caller: PrivateKey, amount: Field) {
    const callerAddress = caller.toPublicKey();

    const balance = this.account.balance.get();
    this.account.balance.assertEquals(balance);
    const callerAccountUpdate =
      AccountUpdate.defaultAccountUpdate(callerAddress);
    callerAccountUpdate.account.isNew.assertEquals(Bool(true));

    this.send({
      to: AccountUpdate.defaultAccountUpdate(this.address),
      amount: new UInt64(amount),
    });
  }

  @method drainMina(caller: PublicKey) {
    const balance = this.account.balance.get();
    this.account.balance.assertEquals(balance);
    const callerAccountUpdate = AccountUpdate.defaultAccountUpdate(caller);
    this.send({
      to: callerAccountUpdate,
      amount: balance,
    });

    const currentCounter = this.counter.get();
    this.counter.assertEquals(currentCounter);

    this.counter.set(currentCounter.add(1));

    this.drainer.set(caller);
  }
}
