import { expect } from "chai";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  it("should set the baseURI", async () => {
    await expect(
      ctx.contract.setBaseURI(
        "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/"
      )
    ).to.emit(ctx.contract, "SetBaseURI");
  });

  it("should fail to set the baseURI", async () => {
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .setBaseURI("ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/")
    ).to.be.revertedWith("NotModeratorOrOwner");
  });

  it("should fail to set the baseURI because trailing slash is not set", async () => {
    await expect(
      ctx.contract.setBaseURI(
        "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu"
      )
    ).to.be.revertedWith("NoTrailingSlash");
  });

  it("should fail to retrieve tokenURI", async () => {
    await expect(
      ctx.contract.connect(ctx.user2).tokenURI(1)
    ).to.be.revertedWith("URI query for nonexistent token");
  });

  it("should retrieve correct default tokenURI", async () => {
    await expect(ctx.contract.giveawayMint([ctx.user1.address], [1])).to.emit(
      ctx.contract,
      "Transfer"
    );

    expect(await ctx.contract.connect(ctx.user2).tokenURI(0)).to.equal(
      `https://jfmc-api-hxs7r5kyjq-uc.a.run.app/token/${0}.json`
    );
  });

  it("should retrieve correct updated tokenURI", async () => {
    await expect(
      ctx.contract.setBaseURI(
        "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/"
      )
    ).to.emit(ctx.contract, "SetBaseURI");

    await expect(ctx.contract.giveawayMint([ctx.user1.address], [10])).to.emit(
      ctx.contract,
      "Transfer"
    );

    expect(await ctx.contract.connect(ctx.user2).tokenURI(0)).to.equal(
      `ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/token/${0}.json`
    );

    expect(await ctx.contract.connect(ctx.user2).tokenURI(1)).to.equal(
      `ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/token/${1}.json`
    );
  });

  it("should retrieve correct default contractURI", async () => {
    expect(await ctx.contract.connect(ctx.user2).contractURI()).to.equal(
      `https://jfmc-api-hxs7r5kyjq-uc.a.run.app/contract.json`
    );
  });

  it("should retrieve correctly updated contractURI", async () => {
    await expect(
      ctx.contract.setBaseURI(
        "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/"
      )
    ).to.emit(ctx.contract, "SetBaseURI");

    expect(await ctx.contract.connect(ctx.user2).contractURI()).to.equal(
      `ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/contract.json`
    );
  });

  describe("moderator permissions", async () => {
    it("moderator can start allow list mint", async () => {
      await expect(
        ctx.contract
          .connect(ctx.mod)
          .setBaseURI("ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/")
      ).to.emit(ctx.contract, "SetBaseURI");
    });
  });
}
