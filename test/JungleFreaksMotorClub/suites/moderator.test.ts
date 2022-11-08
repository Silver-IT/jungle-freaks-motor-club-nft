import { expect } from "chai";
import { BigNumber } from "ethers";
import { formatBytes32String } from "ethers/lib/utils";
import { ethers } from "hardhat";
import keccak256 from "keccak256";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  const DEFAULT_ADMIN_ROLE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const MODERATOR = keccak256("MODERATOR");

  it("should transfer ownership", async () => {
    expect(
      await ctx.contract.hasRole(DEFAULT_ADMIN_ROLE, ctx.owner.address)
    ).to.eq(true);
    await expect(ctx.contract.transferOwnership(ctx.approved.address)).to.emit(
      ctx.contract,
      "OwnershipTransferred"
    );
    expect(
      await ctx.contract.hasRole(DEFAULT_ADMIN_ROLE, ctx.approved.address)
    ).to.eq(true);
    expect(
      await ctx.contract.hasRole(DEFAULT_ADMIN_ROLE, ctx.owner.address)
    ).to.eq(false);
  });

  it("should grant role after ownership transfer", async () => {
    await expect(ctx.contract.transferOwnership(ctx.approved.address)).to.emit(
      ctx.contract,
      "OwnershipTransferred"
    );

    expect(
      await ctx.contract
        .connect(ctx.approved)
        .grantRole(MODERATOR, ctx.user1.address)
    ).to.emit(ctx.contract, "RoleGranted");

    await expect(
      ctx.contract
        .connect(ctx.user1)
        .setBaseURI("ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/")
    ).to.emit(ctx.contract, "SetBaseURI");

    expect(
      await ctx.contract
        .connect(ctx.approved)
        .revokeRole(MODERATOR, ctx.user1.address)
    ).to.emit(ctx.contract, "RoleRevoked");

    await expect(
      ctx.contract
        .connect(ctx.user1)
        .setBaseURI("ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/")
    ).to.be.revertedWith("NotModeratorOrOwner");
  });
}
