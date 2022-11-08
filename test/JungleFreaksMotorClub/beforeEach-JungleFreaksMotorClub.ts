import { ethers } from "hardhat";

beforeEach(async function () {
  const ctx = this.test?.ctx;
  if (!ctx) return;

  const jfContract = await this.jfContractFactory.deploy();
  this.jfContract = await jfContract.deployed();

  const jflContract = await this.jflContractFactory.deploy();
  this.jflContract = await jflContract.deployed();

  const standardERC20 = await this.StandardERC20Factory.deploy();
  this.standardERC20 = await standardERC20.deployed();
  this.standardERC20
    .connect(this.approved)
    .mint(ethers.utils.parseEther("100"));

  const jungleContract = await this.jungleContractFactory.deploy(
    jfContract.address,
    jflContract.address
  );
  this.jungleContract = await jungleContract.deployed();

  const rrContract = await this.rrContractFactory.deploy();
  this.rrContract = await rrContract.deployed();

  const contract = await ctx.contractFactory.deploy(
    ctx.signer.address,
    ctx.mod.address,
    ctx.rrContract.address,
    ctx.jfContract.address,
    ctx.jflContract.address,
    ctx.jungleContract.address
  );
  this.contract = await contract.deployed();

  const brokenWallet = await this.brokenWalletFactory.deploy();
  this.brokenWallet = await brokenWallet.deployed();
});
