import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  it("should get price equal to 0.1 eth", async () => {
    expect(await ctx.contract.SALE_PRICE()).to.eq(
      ethers.utils.parseEther("0.1")
    );
  });

  it("should get total supply quantity equal to 8888", async () => {
    expect(await ctx.contract.MAX_SUPPLY()).to.eq(BigNumber.from(8888));
  });

  it("should get mint limit equal to 5", async () => {
    expect(await ctx.contract.MAX_BATCH_MINT()).to.equal(BigNumber.from(5));
  });
}
