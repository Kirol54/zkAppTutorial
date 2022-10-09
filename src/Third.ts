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
  /**
   * This method sends Mina to this SmartContract and
   * increments inboundCounter by the amount
   * @param amount amount of nanoMina to be transferred
   */
  @method sendMina(amount: UInt64) {
    const currentCounter = this.inboundCounter.get();
    this.inboundCounter.assertEquals(currentCounter);
    this.balance.addInPlace(amount);

    this.inboundCounter.set(currentCounter.add(amount));
  }
  /**
   * This method allows calller to withdraw Mina to this SmartContract and
   * increments outboundCounter by the amount
   * @param reciver PublicKey of the reciver
   * @param amount amount of nanoMina to be withdrawn
   */
  @method withdrawMina(reciver: PublicKey, amount: UInt64) {
    this.balance.subInPlace(amount);
    const currentCounter = this.outboundCounter.get();
    this.outboundCounter.assertEquals(currentCounter);

    this.outboundCounter.set(currentCounter.add(amount));

    this.drainer.set(reciver);
  }
}
