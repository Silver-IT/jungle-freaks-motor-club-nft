import { expect } from "chai";
import { ethers } from "hardhat";

export default function suite() {
  const NOT_STARTED = 0;
  const ACTIVE = 1;
  const PAUSED = 2;
  const FINISHED = 3;

  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  it("should end sale after allow list mint", async () => {
    await expect(ctx.contract.endMint()).to.be.revertedWith("NoActiveSale");

    await expect(ctx.contract.startAllowListMint()).to.emit(
      ctx.contract,
      "AllowListMintBegins"
    );

    await expect(ctx.contract.endMint()).to.emit(ctx.contract, "MintEnds");
  });

  it("should end sale after holders mint", async () => {
    await expect(ctx.contract.endMint()).to.be.revertedWith("NoActiveSale");

    await expect(ctx.contract.startHoldersMint()).to.emit(
      ctx.contract,
      "HoldersMintBegins"
    );

    await expect(ctx.contract.endMint()).to.emit(ctx.contract, "MintEnds");
  });

  it("should end sale after public mint", async () => {
    await expect(ctx.contract.endMint()).to.be.revertedWith("NoActiveSale");

    await expect(ctx.contract.startPublicMint()).to.emit(
      ctx.contract,
      "PublicMintBegins"
    );

    await expect(ctx.contract.endMint()).to.emit(ctx.contract, "MintEnds");
  });

  it("end sale no longer allows change of sale state", async () => {
    await expect(ctx.contract.startAllowListMint()).to.emit(
      ctx.contract,
      "AllowListMintBegins"
    );
    await expect(ctx.contract.startHoldersMint()).to.emit(
      ctx.contract,
      "HoldersMintBegins"
    );
    await expect(ctx.contract.startPublicMint()).to.emit(
      ctx.contract,
      "PublicMintBegins"
    );
    await expect(ctx.contract.endMint()).to.emit(ctx.contract, "MintEnds");

    await expect(ctx.contract.startAllowListMint()).to.be.revertedWith(
      "AllSalesFinished"
    );

    await expect(ctx.contract.startHoldersMint()).to.be.revertedWith(
      "AllSalesFinished"
    );

    await expect(ctx.contract.startPublicMint()).to.be.revertedWith(
      "AllSalesFinished"
    );

    await expect(ctx.contract.endMint()).to.be.revertedWith("NoActiveSale");
  });

  it("should set correct values for each sale state", async () => {
    expect(await ctx.contract.getSaleType()).to.eql("None");

    await expect(ctx.contract.startAllowListMint()).to.emit(
      ctx.contract,
      "AllowListMintBegins"
    );
    expect(await ctx.contract.getSaleType()).to.be.eql("AllowListMint");

    await expect(ctx.contract.startHoldersMint()).to.emit(
      ctx.contract,
      "HoldersMintBegins"
    );
    expect(await ctx.contract.getSaleType()).to.be.eql("HoldersMint");

    await expect(ctx.contract.startPublicMint()).to.emit(
      ctx.contract,
      "PublicMintBegins"
    );
    expect(await ctx.contract.getSaleType()).to.be.eql("PublicMint");

    await expect(ctx.contract.endMint()).to.emit(ctx.contract, "MintEnds");
    expect(await ctx.contract.getSaleType()).to.be.eql("Finished");
    expect(await ctx.contract.getSaleState()).to.be.eql(FINISHED);
  });

  it("pauses a sale state", async () => {
    await expect(ctx.contract.startAllowListMint()).to.emit(
      ctx.contract,
      "AllowListMintBegins"
    );
    await expect(ctx.contract.pauseMint()).to.not.be.reverted;
    expect(await ctx.contract.getSaleState()).to.be.eql(PAUSED);

    await expect(ctx.contract.startHoldersMint()).to.emit(
      ctx.contract,
      "HoldersMintBegins"
    );
    await expect(ctx.contract.pauseMint()).to.not.be.reverted;
    expect(await ctx.contract.getSaleState()).to.be.eql(PAUSED);

    await expect(ctx.contract.startPublicMint()).to.emit(
      ctx.contract,
      "PublicMintBegins"
    );
    await expect(ctx.contract.pauseMint()).to.not.be.reverted;
    expect(await ctx.contract.getSaleState()).to.be.eql(PAUSED);
  });

  it("unpauses a paused sale state", async () => {
    await expect(ctx.contract.startAllowListMint()).to.emit(
      ctx.contract,
      "AllowListMintBegins"
    );
    await expect(ctx.contract.pauseMint()).to.not.be.reverted;
    expect(await ctx.contract.getSaleState()).to.be.eql(PAUSED);
    expect(await ctx.contract.getSaleType()).to.be.eql("AllowListMint");
    await expect(ctx.contract.unpauseMint()).to.not.be.reverted;
    expect(await ctx.contract.getSaleState()).to.be.eql(ACTIVE);
    expect(await ctx.contract.getSaleType()).to.be.eql("AllowListMint");

    await expect(ctx.contract.startHoldersMint()).to.emit(
      ctx.contract,
      "HoldersMintBegins"
    );
    await expect(ctx.contract.pauseMint()).to.not.be.reverted;
    expect(await ctx.contract.getSaleState()).to.be.eql(PAUSED);
    expect(await ctx.contract.getSaleType()).to.be.eql("HoldersMint");
    await expect(ctx.contract.unpauseMint()).to.not.be.reverted;
    expect(await ctx.contract.getSaleState()).to.be.eql(ACTIVE);
    expect(await ctx.contract.getSaleType()).to.be.eql("HoldersMint");

    await expect(ctx.contract.startPublicMint()).to.emit(
      ctx.contract,
      "PublicMintBegins"
    );
    await expect(ctx.contract.pauseMint()).to.not.be.reverted;
    expect(await ctx.contract.getSaleState()).to.be.eql(PAUSED);
    expect(await ctx.contract.getSaleType()).to.be.eql("PublicMint");
    await expect(ctx.contract.unpauseMint()).to.not.be.reverted;
    expect(await ctx.contract.getSaleState()).to.be.eql(ACTIVE);
    expect(await ctx.contract.getSaleType()).to.be.eql("PublicMint");
  });

  it("can not pause a paused sale state", async () => {
    await expect(ctx.contract.startAllowListMint()).to.emit(
      ctx.contract,
      "AllowListMintBegins"
    );
    await expect(ctx.contract.pauseMint()).to.not.be.reverted;
    await expect(ctx.contract.pauseMint()).to.be.revertedWith("NoActiveSale");

    await expect(ctx.contract.startHoldersMint()).to.emit(
      ctx.contract,
      "HoldersMintBegins"
    );
    await expect(ctx.contract.pauseMint()).to.not.be.reverted;
    await expect(ctx.contract.pauseMint()).to.be.revertedWith("NoActiveSale");

    await expect(ctx.contract.startPublicMint()).to.emit(
      ctx.contract,
      "PublicMintBegins"
    );
    await expect(ctx.contract.pauseMint()).to.not.be.reverted;
    await expect(ctx.contract.pauseMint()).to.be.revertedWith("NoActiveSale");
  });

  it("can not unpause an active sale state", async () => {
    await expect(ctx.contract.startAllowListMint()).to.emit(
      ctx.contract,
      "AllowListMintBegins"
    );

    await expect(ctx.contract.unpauseMint()).to.be.revertedWith("NoPausedSale");
    await expect(ctx.contract.startHoldersMint()).to.emit(
      ctx.contract,
      "HoldersMintBegins"
    );

    await expect(ctx.contract.unpauseMint()).to.be.revertedWith("NoPausedSale");

    await expect(ctx.contract.startPublicMint()).to.emit(
      ctx.contract,
      "PublicMintBegins"
    );
    await expect(ctx.contract.unpauseMint()).to.be.revertedWith("NoPausedSale");
  });

  it("can not change pause state when no sale active", async () => {
    await expect(ctx.contract.pauseMint()).to.be.revertedWith("NoActiveSale");
    await expect(ctx.contract.unpauseMint()).to.be.revertedWith("NoPausedSale");

    await expect(ctx.contract.startHoldersMint()).to.emit(
      ctx.contract,
      "HoldersMintBegins"
    );
    await expect(ctx.contract.startAllowListMint()).to.emit(
      ctx.contract,
      "AllowListMintBegins"
    );
    await expect(ctx.contract.startPublicMint()).to.emit(
      ctx.contract,
      "PublicMintBegins"
    );
    await expect(ctx.contract.endMint()).to.emit(ctx.contract, "MintEnds");

    await expect(ctx.contract.pauseMint()).to.be.revertedWith("NoActiveSale");
    await expect(ctx.contract.unpauseMint()).to.be.revertedWith("NoPausedSale");
  });
  describe("moderator permissions", async () => {
    it("can start allow list mint", async () => {
      await expect(ctx.contract.connect(ctx.mod).startAllowListMint()).to.emit(
        ctx.contract,
        "AllowListMintBegins"
      );
    });
    it("can start holders guarantee mint", async () => {
      await expect(
        ctx.contract.connect(ctx.mod).startHoldersGuaranteeMint()
      ).to.emit(ctx.contract, "HoldersGuaranteeMintBegins");
    });
    it("can start holders mint", async () => {
      await expect(ctx.contract.connect(ctx.mod).startHoldersMint()).to.emit(
        ctx.contract,
        "HoldersMintBegins"
      );
    });
    it("can start public mint", async () => {
      await expect(ctx.contract.connect(ctx.mod).startPublicMint()).to.emit(
        ctx.contract,
        "PublicMintBegins"
      );
    });
    it("can end minting", async () => {
      await expect(ctx.contract.connect(ctx.mod).startPublicMint()).to.emit(
        ctx.contract,
        "PublicMintBegins"
      );
      await expect(ctx.contract.connect(ctx.mod).endMint()).to.emit(
        ctx.contract,
        "MintEnds"
      );
    });

    it("can pause minting", async () => {
      await expect(ctx.contract.connect(ctx.mod).startPublicMint()).to.emit(
        ctx.contract,
        "PublicMintBegins"
      );
      await expect(ctx.contract.connect(ctx.mod).pauseMint()).to.not.be
        .reverted;
    });

    it("can unpause minting", async () => {
      await expect(ctx.contract.connect(ctx.mod).startPublicMint()).to.emit(
        ctx.contract,
        "PublicMintBegins"
      );
      await expect(ctx.contract.connect(ctx.mod).pauseMint()).to.not.be
        .reverted;
      await expect(ctx.contract.connect(ctx.mod).unpauseMint()).to.not.be
        .reverted;
    });

    it("fails to start allow list mint due to permissions", async () => {
      await expect(
        ctx.contract.connect(ctx.user1).startAllowListMint()
      ).to.be.revertedWith("NotModeratorOrOwner");
    });
    it("fails to start holders guarantee mint", async () => {
      await expect(
        ctx.contract.connect(ctx.user1).startHoldersGuaranteeMint()
      ).to.be.revertedWith("NotModeratorOrOwner");
    });
    it("fails to start holders mint", async () => {
      await expect(
        ctx.contract.connect(ctx.user1).startHoldersMint()
      ).to.be.revertedWith("NotModeratorOrOwner");
    });
    it("fails to start public mint", async () => {
      await expect(
        ctx.contract.connect(ctx.user1).startPublicMint()
      ).to.be.revertedWith("NotModeratorOrOwner");
    });
    it("fails to end minting", async () => {
      await expect(ctx.contract.connect(ctx.mod).startPublicMint()).to.emit(
        ctx.contract,
        "PublicMintBegins"
      );
      await expect(
        ctx.contract.connect(ctx.user1).endMint()
      ).to.be.revertedWith("NotModeratorOrOwner");
    });
  });
}
