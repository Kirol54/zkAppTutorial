import {
  Bool,
  PublicKey,
  PrivateKey,
  Signature,
  Field,
  SmartContract,
  state,
  State,
  method,
  DeployArgs,
  Permissions,
  Circuit,
} from 'snarkyjs';

export class Second extends SmartContract {
  @state(Bool) BoolA = State<Bool>();
  @state(Bool) BoolB = State<Bool>();
  @state(PublicKey as any) user = State<PublicKey>();
  @state(Field) conditionalState = State<Field>();

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
  }

  @method boolMethods(inputValue: Field) {
    //   let b = x.equals(8); // b = Bool(false)
    //   b = b.not().or(b).and(b); // b = Bool(true)
    //   b.toBoolean(); // true
    //assertGreater(1)?
    const isInputGreater = inputValue.gt(8);
    this.BoolA.set(isInputGreater);
    // const currentState1 = this.state1.get();
    // this.state1.assertEquals(currentState1);

    const isInputLower = inputValue.lte(50);

    const isInRange = isInputGreater.and(isInputLower);
    this.BoolB.set(isInRange);
  }
  @method verifyUser(userPrivKey: PrivateKey) {
    // name setUser
    // returns public key of the user ?
    const userAddr = userPrivKey.toPublicKey();
    this.user.set(userAddr);
  }
  @method signature(x: Field, signature: Signature) {
    const ownerAddr = this.user.get();
    this.user.assertEquals(ownerAddr);
    signature.verify(ownerAddr, [x]).assertTrue();
  }

  @method conditional() {
    const isInRange = this.BoolB.get();
    this.BoolB.assertEquals(isInRange);
    const x = Circuit.if(isInRange, Field.one, Field(1337)); // behaves like `foo ? a : b`
    this.conditionalState.set(x);
  }
}
