import {
  Field,
  SmartContract,
  state,
  State,
  method,
  DeployArgs,
  Permissions,
  Poseidon,
} from 'snarkyjs';

export class First extends SmartContract {
  @state(Field) state1 = State<Field>();
  @state(Field) state2 = State<Field>();
  @state(Field) state3 = State<Field>();
  @state(Field) stateHash = State<Field>();

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
  }

  /**
   * This method sets state1 to Field(1)
   */
  @method setState() {
    this.state1.set(Field(1));
  }
  /**
   * This method sets state1 to currentState1 + Field(2)
   */
  @method updateState() {
    const currentState = this.state1.get();
    this.state1.assertEquals(currentState); // precondition that links this.num.get() to the actual on-chain state
    const newState = currentState.add(2);
    newState.assertEquals(currentState.add(2));
    this.state1.set(newState);
  }
  /**
   * This method sets state1 to currentState1 times inputVaue
   * and sets state 2 to newState1 squared.
   * @param inputValue
   */
  @method mathOne(inputValue: Field) {
    const currentState1 = this.state1.get();
    this.state1.assertEquals(currentState1);

    const newState1 = currentState1.mul(inputValue);
    newState1.assertEquals(currentState1.mul(inputValue));
    this.state1.set(newState1);
    const newState2 = newState1.square();
    newState2.assertEquals(newState1.square());
    this.state2.set(newState2);
  }
  /**
   * This method sets state1 to currentState1 divided by inputVaue
   * and sets state 2 to square root of currentState2
   * @param inputValue
   */
  @method mathTwo(inputValue: Field) {
    const currentState1 = this.state1.get();
    this.state1.assertEquals(currentState1);
    const newState1 = currentState1.div(inputValue);
    newState1.assertEquals(currentState1.div(inputValue));
    this.state1.set(newState1);

    const currentState2 = this.state2.get();
    this.state2.assertEquals(currentState2);

    const newState2 = currentState2.sqrt();

    newState2.assertEquals(currentState2.sqrt());
    this.state2.set(newState2);
  }
  /**
   * This method sets stateHash to hash of
   * state1, state2 and input value.
   * @param inputValue
   */
  @method hashing(inputValue: Field) {
    const currentState1 = this.state1.get();
    this.state1.assertEquals(currentState1);
    const currentState2 = this.state2.get();
    this.state2.assertEquals(currentState2);

    let hash = Poseidon.hash([currentState1, currentState2, inputValue]); // takes array of Fields, returns Field
    this.stateHash.set(hash);
  }
}
