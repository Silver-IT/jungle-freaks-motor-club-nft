import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { randomBytes } from "crypto";
import { expect } from "chai";
import signMintRequest from "../../utils/signMintRequest";
import { MockContract } from "@defi-wonderland/smock";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  const jungleBank = "0x8e5f332a0662c8c06bdd1eed105ba1c4800d4c2f";

  let salt: string;
  let jungle: BigNumber;
  let apiSignature: string;
  let price: BigNumber;
  beforeEach(async function () {
    // Default mints
    salt = "0x" + randomBytes(8).toString("hex");

    await expect(ctx.contract.startHoldersGuaranteeMint()).to.emit(
      ctx.contract,
      "HoldersGuaranteeMintBegins"
    );
  });

  it("should allow when holding 1 jungle freak", async () => {
    await ctx.jfContract.safeMintTo(ctx.user1.address, 1);

    jungle = ethers.utils.parseEther("0");

    price = await ctx.contract.holdersEthPrice(jungle, 1);

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256"],
      [jungle]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .holdersGuaranteeMint(apiSignature, salt, jungle, {
          value: price,
        })
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(1);

    expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);
  });

  it("should allow when holding 1 legendary coft", async () => {
    await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 1);

    jungle = ethers.utils.parseEther("0");

    price = await ctx.contract.holdersEthPrice(jungle, 1);

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256"],
      [jungle]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .holdersGuaranteeMint(apiSignature, salt, jungle, {
          value: price,
        })
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(1);

    expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);
  });

  it("should allow when holding 1 legendary mtfm", async () => {
    await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryMTFM, 1);

    jungle = ethers.utils.parseEther("0");

    price = await ctx.contract.holdersEthPrice(jungle, 1);

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256"],
      [jungle]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .holdersGuaranteeMint(apiSignature, salt, jungle, {
          value: price,
        })
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(1);

    expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);
  });

  it("should allow when holding 1 staked jungle freak", async () => {
    await ctx.jfContract.safeMintTo(ctx.user1.address, 1);

    await ctx.jungleContract.toggle();
    await ctx.jfContract
      .connect(ctx.user1)
      .setApprovalForAll(ctx.jungleContract.address, true);
    await ctx.jungleContract.connect(ctx.user1).stakeById([0]);

    jungle = ethers.utils.parseEther("0");

    price = await ctx.contract.holdersEthPrice(jungle, 1);

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256"],
      [jungle]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .holdersGuaranteeMint(apiSignature, salt, jungle, {
          value: price,
        })
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(1);

    expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);
  });

  it("should allow when holding 1 staked legendary freak", async () => {
    await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 3);
    await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryMTFM, 3);
    await ctx.jfContract.safeMintTo(ctx.user1.address, 4);

    await ctx.jungleContract.toggle();
    await ctx.jflContract
      .connect(ctx.user1)
      .setApprovalForAll(ctx.jungleContract.address, true);
    await ctx.jungleContract.connect(ctx.user1).stakeLegendaries(0, 1);

    jungle = ethers.utils.parseEther("0");

    price = await ctx.contract.holdersEthPrice(jungle, 1);

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256"],
      [jungle]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .holdersGuaranteeMint(apiSignature, salt, jungle, {
          value: price,
        })
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(1);

    expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);
  });

  it("should fail to mint twice", async () => {
    await ctx.jfContract.safeMintTo(ctx.user1.address, 1);

    jungle = ethers.utils.parseEther("0");

    price = await ctx.contract.holdersEthPrice(jungle, 1);

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256"],
      [jungle]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .holdersGuaranteeMint(apiSignature, salt, jungle, {
          value: price,
        })
    ).to.emit(ctx.contract, "Transfer");

    expect(
      (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(1);

    expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);

    salt = "0x" + randomBytes(8).toString("hex");

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256"],
      [jungle]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .holdersGuaranteeMint(apiSignature, salt, jungle, {
          value: price,
        })
    ).to.be.revertedWith("MintAddressUsed");
  });

  it("should revert with a NotHoldingJungleFreaks message", async () => {
    jungle = ethers.utils.parseEther("0");

    price = await ctx.contract.holdersEthPrice(jungle, 1);

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user9.address,
      salt,
      ["uint256"],
      [jungle]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user9)
        .holdersGuaranteeMint(apiSignature, salt, jungle, {
          value: price,
        })
    ).to.be.revertedWith("NotHoldingJungleFreaks");
  });

  it("should mint only MAX_SUPPLY", async () => {
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
    const maxSupply = 5;
    await mockContract.setVariable("MAX_SUPPLY", maxSupply);
    await mockContract.setVariable("reserved", 0);

    await expect(mockContract.startHoldersGuaranteeMint()).to.emit(
      mockContract,
      "HoldersGuaranteeMintBegins"
    );

    const wallets = [ctx.user1, ctx.user2, ctx.user3, ctx.user4, ctx.user5];

    // Mint the entire allow list supply to different wallets
    await Promise.all(
      wallets.map((wallet) =>
        (async (wallet) => {
          const salt = "0x" + randomBytes(8).toString("hex");

          // State set up
          await ctx.jfContract.safeMintTo(wallet.address, 10);
          const jungle = ethers.utils.parseEther("0");

          const price = await mockContract.holdersEthPrice(jungle, 1);

          const apiSignature = await signMintRequest(
            ctx.signer,
            wallet.address,
            salt,
            ["uint256"],
            [jungle]
          );

          return expect(
            mockContract
              .connect(wallet)
              .holdersGuaranteeMint(apiSignature, salt, jungle, {
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
      await ctx.jfContract.safeMintTo(ctx.user6.address, 10);
      const jungle = ethers.utils.parseEther("0");

      const price = await mockContract.holdersEthPrice(jungle, 1);

      const apiSignature = await signMintRequest(
        ctx.signer,
        ctx.user6.address,
        salt,
        ["uint256"],
        [jungle]
      );

      await expect(
        mockContract
          .connect(ctx.user6)
          .holdersGuaranteeMint(apiSignature, salt, jungle, {
            value: price,
          })
      ).to.be.revertedWith("SoldOut");
    }

    expect(await mockContract.totalSupply()).to.eq(BigNumber.from(maxSupply));
  });
  describe("spending jungle", async () => {
    it("should allow when holding 1 jungle freak and spending 75 jungle", async () => {
      await ctx.jfContract.safeMintTo(ctx.user1.address, 1);
      await ctx.jungleContract.mint(
        ctx.user1.address,
        ethers.utils.parseEther("150")
      );
      await ctx.jungleContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.contract.address, true);

      jungle = ethers.utils.parseEther("75");

      price = await ctx.contract.holdersEthPrice(jungle, 1);

      expect(price).to.eql(ethers.utils.parseEther("0.06"));

      apiSignature = await signMintRequest(
        ctx.signer,
        ctx.user1.address,
        salt,
        ["uint256"],
        [jungle]
      );

      // Mint
      await expect(
        ctx.contract
          .connect(ctx.user1)
          .holdersGuaranteeMint(apiSignature, salt, jungle, {
            value: price,
          })
      ).to.emit(ctx.contract, "Transfer");

      expect(
        (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
      ).to.be.eq(1);

      expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);

      expect(await ctx.jungleContract.balanceOf(jungleBank)).to.eq(
        ethers.utils.parseEther("75")
      );

      expect(await ctx.jungleContract.balanceOf(ctx.user1.address)).to.eq(
        ethers.utils.parseEther("75")
      );
    });

    it("should allow when holding 1 jungle freak and spending 150 jungle", async () => {
      await ctx.jfContract.safeMintTo(ctx.user1.address, 1);
      await ctx.jungleContract.mint(
        ctx.user1.address,
        ethers.utils.parseEther("150")
      );
      await ctx.jungleContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.contract.address, true);

      jungle = ethers.utils.parseEther("150");

      price = await ctx.contract.holdersEthPrice(jungle, 1);

      expect(price).to.eql(ethers.utils.parseEther("0.04"));

      apiSignature = await signMintRequest(
        ctx.signer,
        ctx.user1.address,
        salt,
        ["uint256"],
        [jungle]
      );

      // Mint
      await expect(
        ctx.contract
          .connect(ctx.user1)
          .holdersGuaranteeMint(apiSignature, salt, jungle, {
            value: price,
          })
      ).to.emit(ctx.contract, "Transfer");

      expect(
        (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
      ).to.be.eq(1);

      expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);

      expect(await ctx.jungleContract.balanceOf(jungleBank)).to.eq(
        ethers.utils.parseEther("150")
      );

      expect(await ctx.jungleContract.balanceOf(ctx.user1.address)).to.eq(
        ethers.utils.parseEther("0")
      );
    });

    it("should allow when holding 1 jungle freak and spending 300 jungle", async () => {
      await ctx.jfContract.safeMintTo(ctx.user1.address, 1);
      await ctx.jungleContract.mint(
        ctx.user1.address,
        ethers.utils.parseEther("500")
      );
      await ctx.jungleContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.contract.address, true);

      jungle = ethers.utils.parseEther("300");

      price = await ctx.contract.holdersEthPrice(jungle, 1);

      expect(price).to.eql(ethers.utils.parseEther("0.00"));

      apiSignature = await signMintRequest(
        ctx.signer,
        ctx.user1.address,
        salt,
        ["uint256"],
        [jungle]
      );

      // Mint
      await expect(
        ctx.contract
          .connect(ctx.user1)
          .holdersGuaranteeMint(apiSignature, salt, jungle, {
            value: price,
          })
      ).to.emit(ctx.contract, "Transfer");

      expect(
        (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
      ).to.be.eq(1);

      expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);

      expect(await ctx.jungleContract.balanceOf(jungleBank)).to.eq(
        ethers.utils.parseEther("300")
      );

      expect(await ctx.jungleContract.balanceOf(ctx.user1.address)).to.eq(
        ethers.utils.parseEther("200")
      );
    });

    it("should fail when holding 1 jungle freak and spending 300 jungle because of not enough jungle", async () => {
      await ctx.jfContract.safeMintTo(ctx.user1.address, 1);
      await ctx.jungleContract.mint(
        ctx.user1.address,
        ethers.utils.parseEther("250")
      );
      await ctx.jungleContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.contract.address, true);

      jungle = ethers.utils.parseEther("300");

      price = await ctx.contract.holdersEthPrice(jungle, 1);

      expect(price).to.eql(ethers.utils.parseEther("0.00"));

      apiSignature = await signMintRequest(
        ctx.signer,
        ctx.user1.address,
        salt,
        ["uint256"],
        [jungle]
      );

      // Mint
      await expect(
        ctx.contract
          .connect(ctx.user1)
          .holdersGuaranteeMint(apiSignature, salt, jungle, {
            value: price,
          })
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });
}
