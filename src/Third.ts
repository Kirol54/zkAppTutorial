import {
  PublicKey,
  SmartContract,
  method,
  DeployArgs,
  Permissions,
  UInt64,
  State,
  state,
} from 'snarkyjs';

export class Third extends SmartContract {
  @state(UInt64) inboundCounter = State<UInt64>();
  @state(UInt64) outboundCounter = State<UInt64>();

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
  @method sendMina(amount: UInt64) {
    const currentCounter = this.inboundCounter.get();
    this.inboundCounter.assertEquals(currentCounter);
    this.balance.addInPlace(amount);

    this.inboundCounter.set(currentCounter.add(amount));
  }

  @method withdrawMina(caller: PublicKey, amount: UInt64) {
    this.balance.subInPlace(amount);
    const currentCounter = this.outboundCounter.get();
    this.outboundCounter.assertEquals(currentCounter);

    this.outboundCounter.set(currentCounter.add(amount));

    this.drainer.set(caller);
  }
}
