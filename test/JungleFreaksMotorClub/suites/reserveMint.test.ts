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

  let salt: string;
  beforeEach(async function () {
    // Default mints
    salt = "0x" + randomBytes(8).toString("hex");
  });

  it("should mint 20 from owner to user1", async () => {
    const quantity = 20;
    const totalReserved = await ctx.contract.reserved();
    await expect(
      ctx.contract.reservedMint(ctx.user1.address, quantity)
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(quantity);

    for (var i = 0; i < quantity; i++) {
      expect(await ctx.contract.ownerOf(i)).to.be.eq(ctx.user1.address);
    }

    expect(await ctx.contract.reserved()).to.be.eq(totalReserved - quantity);
  });

  it("should mint reserved from owner to user1", async () => {
    const totalReserved = await ctx.contract.reserved();

    await expect(
      ctx.contract.reservedMint(ctx.user1.address, totalReserved)
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(totalReserved);

    for (var i = 0; i < totalReserved; i++) {
      expect(await ctx.contract.ownerOf(i)).to.be.eq(ctx.user1.address);
    }

    expect(await ctx.contract.reserved()).to.be.eq(0);

    await expect(
      ctx.contract.reservedMint(ctx.user1.address, 1)
    ).to.be.revertedWith("ReserveLimitExceeded");
  });

  it("should fail to mint from user1", async () => {
    const quantity = Math.round((await ctx.contract.reserved()) / 2);
    await expect(
      ctx.contract.connect(ctx.user1).reservedMint(ctx.user1.address, quantity)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should reduce the amount of reserved mints from the MAX_SUPPLY", async () => {
    // Init Mock
    const mockContract = await ctx.mockContractFactory.deploy(
      ctx.signer.address,
      ctx.mod.address,
      ctx.rrContract.address,
      ctx.jfContract.address,
      ctx.jflContract.address,
      ctx.jungleContract.address
    );
    await mockContract.deployed();

    // Update allow list supply to something low
    const maxSupply = 25;
    const reserveMint = 10;
    await mockContract.setVariable("MAX_SUPPLY", maxSupply);
    await mockContract.setVariable("reserved", reserveMint);

    await expect(
      mockContract.reservedMint(ctx.user1.address, reserveMint)
    ).to.emit(mockContract, "Transfer");

    await expect(mockContract.startHoldersMint()).to.emit(
      mockContract,
      "HoldersMintBegins"
    );

    const wallets = [ctx.user1, ctx.user2, ctx.user3, ctx.user4, ctx.user5];

    // Mint the entire allow list supply to different wallets
    await Promise.all(
      wallets.map((wallet) =>
        (async (wallet) => {
          const salt = "0x" + randomBytes(8).toString("hex");

          // State set up
          await ctx.jfContract.safeMintTo(wallet.address, 10); // Allowance 3 JFMC
          const quantity = await mockContract.getHoldersTxAllowance(
            wallet.address
          );
          const jungle = ethers.utils.parseEther("0");

          const price = await mockContract.holdersEthPrice(jungle, quantity);

          const apiSignature = await signMintRequest(
            ctx.signer,
            wallet.address,
            salt,
            ["uint256", "uint8"],
            [jungle, quantity]
          );

          return expect(
            mockContract
              .connect(wallet)
              .holdersMint(apiSignature, salt, jungle, quantity, {
                value: price,
              })
          ).to.emit(mockContract, "Transfer");
        })(wallet)
      )
    );

    // Minting 1 more than Allowed
    {
      const salt = "0x" + randomBytes(8).toString("hex");

      // State set up
      await ctx.jfContract.safeMintTo(ctx.user6.address, 10); // Allowance 3 JFMC
      const quantity = await mockContract.getHoldersTxAllowance(
        ctx.user6.address
      );
      const jungle = ethers.utils.parseEther("0");

      const price = await mockContract.holdersEthPrice(jungle, quantity);

      const apiSignature = await signMintRequest(
        ctx.signer,
        ctx.user6.address,
        salt,
        ["uint256", "uint8"],
        [jungle, quantity]
      );

      await expect(
        mockContract
          .connect(ctx.user6)
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("SoldOut");
    }

    expect(await mockContract.totalSupply()).to.eq(BigNumber.from(maxSupply));
  });
}
