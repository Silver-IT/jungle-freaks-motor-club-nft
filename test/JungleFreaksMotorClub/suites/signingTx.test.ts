import { expect } from "chai";
import { randomBytes } from "crypto";
import { BigNumber, Contract, ethers } from "ethers";
import signMintRequest from "../../utils/signMintRequest";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  let salt: string;
  let quantity: number;
  let jungle: BigNumber;
  let price: BigNumber;
  beforeEach(async function () {
    salt = "0x" + randomBytes(8).toString("hex");
    quantity = 1;
    jungle = ethers.utils.parseEther("0");
    await ctx.jfContract.safeMintTo(ctx.user1.address, 1); // Allowance 1 JFMC
  });

  it("should fail to set signer address because because user is not owner", async () => {
    //user1 should be reverted when calling withdrawAll()
    await expect(
      ctx.contract.connect(ctx.user1).setSignerAddress(ctx.user1.address)
    ).to.be.revertedWith("NotModeratorOrOwner");
  });

  it("should set the signer address", async () => {
    await expect(ctx.contract.setSignerAddress(ctx.user1.address)).to.not.be
      .reverted;
  });

  it("should set the signer address and fail as actual signer is not the same", async () => {
    const apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256", "uint8"],
      [jungle, quantity]
    );

    await expect(ctx.contract.startPublicMint()).to.emit(
      ctx.contract,
      "PublicMintBegins"
    );

    await expect(ctx.contract.setSignerAddress(ctx.owner.address)).to.not.be
      .reverted;

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .publicMint(apiSignature, salt, jungle, quantity, {
          value: price,
        })
    ).to.revertedWith("SignatureFailed");
  });

  it("should set signer address and allow list mint successfully", async () => {
    await expect(ctx.contract.setSignerAddress(ctx.owner.address)).to.not.be
      .reverted;

    await expect(ctx.contract.startAllowListMint()).to.emit(
      ctx.contract,
      "AllowListMintBegins"
    );

    const quantity = 2;

    const root = ctx.merkleTree.getHexRoot();
    await expect(ctx.contract.setMerkleRoot(root)).to.not.be.reverted;

    const leaf = ctx.leavesLookup[ctx.user1.address];
    const merkleProof = ctx.merkleTree.getHexProof(leaf);

    const apiSignature = await signMintRequest(
      ctx.owner,
      ctx.user1.address,
      salt,
      ["bytes32[]", "uint8"],
      [merkleProof, quantity]
    );

    const price = await ctx.contract.SALE_PRICE();

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .allowListMint(apiSignature, salt, merkleProof, quantity, {
          value: price.mul(quantity),
        })
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);
  });

  it("should set signer address and holders mint successfully", async () => {
    await expect(ctx.contract.setSignerAddress(ctx.owner.address)).to.not.be
      .reverted;

    await expect(ctx.contract.startHoldersMint()).to.emit(
      ctx.contract,
      "HoldersMintBegins"
    );

    const apiSignature = await signMintRequest(
      ctx.owner,
      ctx.user1.address,
      salt,
      ["uint256", "uint8"],
      [jungle, quantity]
    );

    const price = await ctx.contract.holdersEthPrice(jungle, quantity);

    await expect(
      ctx.contract
        .connect(ctx.user1)
        .holdersMint(apiSignature, salt, jungle, quantity, {
          value: price,
        })
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);

    for (var i = 0; i < quantity; i++) {
      expect(await ctx.contract.ownerOf(i)).to.be.eq(ctx.user1.address);
    }
  });

  it("should set signer address and mint successfully", async () => {
    await expect(ctx.contract.setSignerAddress(ctx.owner.address)).to.not.be
      .reverted;

    await expect(ctx.contract.startPublicMint()).to.emit(
      ctx.contract,
      "PublicMintBegins"
    );

    const apiSignature = await signMintRequest(
      ctx.owner,
      ctx.user1.address,
      salt,
      ["uint256", "uint8"],
      [jungle, quantity]
    );

    const price = await ctx.contract.publicEthPrice(jungle, quantity);

    await expect(
      ctx.contract
        .connect(ctx.user1)
        .publicMint(apiSignature, salt, jungle, quantity, {
          value: price,
        })
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);

    for (var i = 0; i < quantity; i++) {
      expect(await ctx.contract.ownerOf(i)).to.be.eq(ctx.user1.address);
    }
  });
}
