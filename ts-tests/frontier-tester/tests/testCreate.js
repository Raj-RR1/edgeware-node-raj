const { assert } = require("chai");
const { account, initWeb3, describeWithEdgeware } = require('../helpers/utils');

const CreateContract = require('../build/contracts/CreateContract.json');
const SubContract = require('../build/contracts/SubContract.json');
const contract = require("@truffle/contract");

describeWithEdgeware("CreateContract test", async () => {
  it("should spawn subcontract", async () => {
    const web3 = await initWeb3();

    let Create = contract({
      abi: CreateContract.abi,
      unlinked_binary: CreateContract.bytecode,
    });
    Create.setProvider(web3.currentProvider);

    console.log('creating contract');
    let c = await Create.new({ from: account });
    console.log('fetching nonce');
    let startNonce = await web3.eth.getTransactionCount(c.address);
    console.log(`CreateContract address: ${c.address}, nonce: ${startNonce}`);
    // create without value
    let receipt = await c.spawn({ from: account });
    let address = await c.deployed.call({ from: account });

    var Sub = contract({
      abi: SubContract.abi,
      unlinked_binary: SubContract.bytecode,
    });
    Sub.setProvider(web3.currentProvider);
    let cSub = await Sub.at(address);
    let balance = await cSub.getValue.call({ from: account });
    assert.equal(balance, '0', 'balance of deployed subcontract should be 0');

    // check nonce
    let nonce = await web3.eth.getTransactionCount(c.address);
    assert.equal(nonce, startNonce + 1, 'contract nonce should increment');
  });

  it("should spawn subcontract with value", async () => {
    const web3 = await initWeb3();

    let Create = contract({
      abi: CreateContract.abi,
      unlinked_binary: CreateContract.bytecode,
    });
    Create.setProvider(web3.currentProvider);

    let c = await Create.new({ from: account });
    let startNonce = await web3.eth.getTransactionCount(c.address);
    console.log(`CreateContract address: ${c.address}, nonce: ${startNonce}`);
    // create with value
    const value = web3.utils.toWei('10', 'ether');
    await c.spawnWithValue({ value, from: account });
    const address = await c.deployed.call({ from: account });
    var Sub = contract({
      abi: SubContract.abi,
      unlinked_binary: SubContract.bytecode,
    });
    Sub.setProvider(web3.currentProvider);
    let cSub = await Sub.at(address);

    let balOnContract = await cSub.getValue.call({ from: account });
    let balance = await web3.eth.getBalance(cSub.address);
    assert.equal(balOnContract, value, 'new subcontract should have balance paid to it');
    assert.equal(balOnContract, balance, 'new subcontract should have balance paid to it');

    // check nonce
    const nonce = await web3.eth.getTransactionCount(c.address);
    assert.equal(nonce, startNonce + 1, 'contract nonce should increment twice');
  });
});
