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
  @state(PublicKey as any) userAddr = State<PublicKey>();
  @state(Field) conditionalState = State<Field>();

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
  }
  /**
   * This method sets BoolA to true, if inputValue is greater than Field(8) otherwise sets to false
   * and sets BoolB if BoolA is true and inputValue is lesser or equal to Field(50).
   * @param inputValue
   */
  @method boolMethods(inputValue: Field) {
    const isInputGreater = inputValue.gt(8);
    this.BoolA.set(isInputGreater);
    const isInputLower = inputValue.lte(50);
    const isInRange = isInputGreater.and(isInputLower);
    this.BoolB.set(isInRange);
  }
  /**
   * This method sets userAddr to public key of passed userPrivKey
   * @param userPrivKey private key of the user
   */
  @method setUser(userPrivKey: PrivateKey) {
    const userAddr = userPrivKey.toPublicKey();
    this.userAddr.set(userAddr);
  }
  /**
   * This method verifies that signature of x came from user previously set in method above
   * @param x Field element that has been used to create the signature
   * @param signature signed x by the user previously set in setUser()
   */
  @method signature(x: Field, signature: Signature) {
    const ownerAddr = this.userAddr.get();
    this.userAddr.assertEquals(ownerAddr);
    signature.verify(ownerAddr, [x]).assertTrue();
  }
  /**
   * This methods sets conditionalState based on BoolB
   * if true, conditionalState is Field(1)
   * if false, conditionalState is Field(1337)
   */
  @method conditional() {
    const isInRange = this.BoolB.get();
    this.BoolB.assertEquals(isInRange);
    const x = Circuit.if(isInRange, Field.one, Field(1337)); // behaves like `foo ? a : b`
    this.conditionalState.set(x);
  }
}
