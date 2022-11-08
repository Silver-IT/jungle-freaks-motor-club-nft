import { expect } from "chai";
import { randomBytes } from "crypto";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import signMintRequest from "../../utils/signMintRequest";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });
  let quantity: number;
  let totalSupply: number;
  beforeEach(async function () {
    // Default mints
    totalSupply = await ctx.contract.MAX_SUPPLY();
    const reserved = await ctx.contract.reserved();
    quantity = totalSupply - reserved;
  });

  it("should mint 20 giveaway from owner to user1", async () => {
    const quantity = 20;
    await expect(
      ctx.contract.giveawayMint([ctx.user1.address], [quantity])
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);

    for (var i = 0; i < quantity; i++) {
      expect(await ctx.contract.ownerOf(i)).to.be.eq(ctx.user1.address);
    }
  });

  it("should mint all tokens from owner to user1", async () => {
    await expect(
      ctx.contract.giveawayMint([ctx.user1.address], [quantity])
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);
  });

  it("should fail to mint from user1", async () => {
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .giveawayMint([ctx.user1.address], [quantity])
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should mint max supply minus reserved", async () => {
    await expect(
      ctx.contract.giveawayMint([ctx.user1.address], [quantity])
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);

    await expect(
      ctx.contract.giveawayMint([ctx.user1.address], [1])
    ).to.be.revertedWith("SoldOut");
  });

  it("should not mint more than all max supply minus reserved", async () => {
    await expect(
      ctx.contract.giveawayMint([ctx.user1.address], [totalSupply])
    ).to.be.revertedWith("SoldOut");
  });

  it("should mint tokens from owner to users 1-8", async () => {
    const quantity = 40;
    const wallets = [
      ctx.user1.address,
      ctx.user2.address,
      ctx.user3.address,
      ctx.user4.address,
      ctx.user5.address,
      ctx.user6.address,
      ctx.user7.address,
      ctx.user8.address,
    ];
    await expect(
      ctx.contract.giveawayMint(
        wallets,
        new Array(wallets.length).fill(quantity)
      )
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);

    expect(
      (await ctx.contract.balanceOf(ctx.user8.address)).toNumber()
    ).to.be.eq(quantity);

    expect((await ctx.contract.totalSupply()).toNumber()).to.be.eq(
      quantity * wallets.length
    );
  });

  it("should not mint because array lengths are different", async () => {
    await expect(
      ctx.contract.giveawayMint([ctx.user1.address], [1, 2])
    ).to.be.revertedWith("ArrayLengthMismatch");
  });

  it("should mint all tokens from owner to users 1-8", async () => {
    const wallets = [
      ctx.user1.address,
      ctx.user2.address,
      ctx.user3.address,
      ctx.user4.address,
    ];

    quantity = quantity / wallets.length;

    await expect(
      ctx.contract.giveawayMint(
        wallets,
        new Array(wallets.length).fill(quantity)
      )
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);

    expect(
      (await ctx.contract.balanceOf(ctx.user4.address)).toNumber()
    ).to.be.eq(quantity);

    expect((await ctx.contract.totalSupply()).toNumber()).to.be.eq(
      quantity * wallets.length
    );
  });
}
