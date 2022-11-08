import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  it("should burn a token", async () => {
    const quantity = 10;
    await expect(
      ctx.contract.giveawayMint([ctx.user1.address], [quantity])
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);

    for (var i = 0; i < quantity; i++) {
      expect(await ctx.contract.ownerOf(i)).to.be.eq(ctx.user1.address);
    }

    await expect(ctx.contract.connect(ctx.user1).burn(4)).to.emit(
      ctx.contract,
      "Transfer"
    );

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity - 1);

    expect((await ctx.contract.totalSupply()).toNumber()).to.be.eq(
      quantity - 1
    );

    expect(await ctx.contract.ownerOf(3)).to.be.eq(ctx.user1.address);
    await expect(ctx.contract.ownerOf(4)).to.be.revertedWith(
      "OwnerQueryForNonexistentToken"
    );
    expect(await ctx.contract.ownerOf(5)).to.be.eq(ctx.user1.address);
  });

  it("should fail to burn a token because it's called by the wrong user", async () => {
    const quantity = 10;
    await expect(
      ctx.contract.giveawayMint([ctx.user1.address], [quantity])
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);

    for (var i = 0; i < quantity; i++) {
      expect(await ctx.contract.ownerOf(i)).to.be.eq(ctx.user1.address);
    }

    await expect(ctx.contract.connect(ctx.user2).burn(4)).to.be.revertedWith(
      "TransferCallerNotOwnerNorApproved"
    );
  });

  it("should burn a token because it's called by an approved user", async () => {
    const quantity = 10;
    await expect(
      ctx.contract.giveawayMint([ctx.user1.address], [quantity])
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);

    for (var i = 0; i < quantity; i++) {
      expect(await ctx.contract.ownerOf(i)).to.be.eq(ctx.user1.address);
    }

    await expect(
      ctx.contract
        .connect(ctx.user1)
        .setApprovalForAll(ctx.approved.address, true)
    ).to.emit(ctx.contract, "ApprovalForAll");

    await expect(ctx.contract.connect(ctx.approved).burn(4)).to.emit(
      ctx.contract,
      "Transfer"
    );
  });
}
