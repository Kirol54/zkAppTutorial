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
} from 'snarkyjs';

export class Add extends SmartContract {
  @state(Field) state1 = State<Field>();
  @state(Field) state2 = State<Field>();
  @state(Field) state3 = State<Field>();
  @state(Bool) BoolA = State<Bool>();
  @state(Bool) BoolB = State<Bool>();
  @state(PublicKey as any) user = State<PublicKey>();

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proof(),
    });
  }

  @method setState() {
    this.state1.set(Field(1));
  }

  @method updateState() {
    const currentState = this.state1.get();
    this.state1.assertEquals(currentState); // precondition that links this.num.get() to the actual on-chain state
    const newState = currentState.add(2);
    newState.assertEquals(currentState.add(2));
    this.state1.set(newState);
  }
  // two ways to do deploy tx
  // methods that return something?

  @method mathOne(inputValue: Field) {
    const currentState1 = this.state1.get();
    this.state1.assertEquals(currentState1);
    const newState1 = currentState1.mul(inputValue);
    newState1.assertEquals(currentState1.mul(inputValue));
    this.state1.set(newState1);
    //
    const newState2 = newState1.square();
    newState2.assertEquals(newState1.square());
    this.state2.set(newState2);
  }

  @method mathTwo(inputValue: Field) {
    // x = x.sub(1); //
    const currentState1 = this.state1.get();
    this.state1.assertEquals(currentState1);
    const newState1 = currentState1.div(inputValue);
    newState1.assertEquals(currentState1.div(inputValue));
    this.state1.set(newState1);
    //
    const currentState2 = this.state2.get();
    this.state2.assertEquals(currentState2);
    const newState2 = currentState2.sqrt();
    newState2.assertEquals(currentState2.sqrt());
    this.state2.set(newState2);
  }
  @method boolMethods(inputValue: Field) {
    //   let b = x.equals(8); // b = Bool(false)
    //   b = b.not().or(b).and(b); // b = Bool(true)
    //   b.toBoolean(); // true
    let isInputGreater = inputValue.gt(8);
    this.BoolA.set(isInputGreater);
    const currentState1 = this.state1.get();
    this.state1.assertEquals(currentState1);

    let isInputLower = inputValue.lte(50);
    let isInRange = isInputLower.and(isInputGreater);
    this.BoolB.set(isInRange);
  }
  @method verifyUser(userPrivKey: PrivateKey) {
    // returns public key of the user ?
    let userAddr = userPrivKey.toPublicKey();
    this.user.set(userAddr);
    //priv key
  }
  @method signature(x: Field, signature: Signature) {
    let ownerAddr = this.user.get();
    signature.verify(ownerAddr, [x]).assertEquals(true);
  }

  @method assertMethods() {
    //     x.assertEquals(y); // x = y
    // x.assertBoolean(); // x = 0 or x = 1
    // x.assertLt(y);     // x < y
    // x.assertLte(y);    // x <= y
    // x.assertGt(y);     // x > y
    // x.assertGte(y);    // x >= y
  }

  @method conditional() {
    // const x = Circuit.if(new Bool(foo), a, b); // behaves like `foo ? a : b`
  }

  @method hashing() {
    // let hash = Poseidon.hash([x]); // takes array of Fields, returns Field
  }

  @method transferCoin() {}

  //--------------------------------------------------------
  @method networkValues() {
    // ask on office hours/discord, how safe it is ? eth is aint that safe with blocktime
    //     const startDate = UInt64.from(Date.UTC(2022, 9, 1));
    // const endDate = UInt64.from(Date.UTC(2022, 10, 1));
    //     this.network.timestamp.get();
    // this.network.timestamp.assertEquals(timestamp);
    // this.network.timestamp.assertBetween(startDate, endDate);
  }
  @method emitEvent() {
    // events = {
    //   "add-merkle-leaf": Field,
    //   "update-merkle-leaf": Field,
    // }
    // @method updateMerkleTree(leaf: Field, ...) {
    //   this.emitEvent("update-merkle-leaf", leaf);
    //   // ...
    // }
  }

  @method action() {}
  @method reducer() {}
  @method recursion() {}
}
