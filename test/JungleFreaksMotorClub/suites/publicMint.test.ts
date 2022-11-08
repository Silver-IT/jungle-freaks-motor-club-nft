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

  const jungleBank = "0x8e5f332a0662c8c06bdd1eed105ba1c4800d4c2f";

  let salt: string;
  let quantity: number;
  let jungle: BigNumber;
  let apiSignature: string;
  let price: BigNumber;
  beforeEach(async function () {
    salt = "0x" + randomBytes(8).toString("hex");
    quantity = 2;
    jungle = ethers.utils.parseEther("0");
    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256", "uint8"],
      [jungle, quantity]
    );
    price = await ctx.contract.publicEthPrice(jungle, quantity);

    await expect(ctx.contract.startPublicMint()).to.emit(
      ctx.contract,
      "PublicMintBegins"
    );
  });

  it("should allow minting with a valid signature", async () => {
    // Mint
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

    expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);
  });

  it("should not allow reuse of the same request", async () => {
    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .publicMint(apiSignature, salt, jungle, quantity, {
          value: price,
        })
    ).to.emit(ctx.contract, "Transfer");

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .publicMint(apiSignature, salt, jungle, quantity, {
          value: price,
        })
    ).to.be.revertedWith("HashUsed");
  });

  it("should not allow minting when eth value is incorrect", async () => {
    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .publicMint(apiSignature, salt, jungle, quantity, {
          value: price.sub(ethers.utils.parseEther("0.01")),
        })
    ).to.be.revertedWith("IncorrectEthValue");

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .publicMint(apiSignature, salt, jungle, quantity, {
          value: price.add(ethers.utils.parseEther("0.01")),
        })
    ).to.be.revertedWith("IncorrectEthValue");
  });

  it("should mint the MAX_BATCH_MINT per transaction", async () => {
    quantity = (await ctx.contract.MAX_BATCH_MINT()).toNumber();
    price = await ctx.contract.publicEthPrice(jungle, quantity);
    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256", "uint8"],
      [jungle, quantity]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .publicMint(apiSignature, salt, jungle, quantity, {
          value: price,
        })
    ).to.emit(ctx.contract, "Transfer");
  });

  it("should fail to mint more than the MAX_BATCH_MINT per transaction", async () => {
    quantity = (await ctx.contract.MAX_BATCH_MINT()).toNumber() + 1;
    price = await ctx.contract.publicEthPrice(jungle, quantity);
    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256", "uint8"],
      [jungle, quantity]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .publicMint(apiSignature, salt, jungle, quantity, {
          value: price,
        })
    ).to.be.revertedWith("TransactionMintLimit");
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
    const maxSupply = 15;
    await mockContract.setVariable("MAX_SUPPLY", maxSupply);
    await mockContract.setVariable("reserved", 0);

    await expect(mockContract.startPublicMint()).to.emit(
      mockContract,
      "PublicMintBegins"
    );

    const wallets = [ctx.user1, ctx.user2, ctx.user3];

    // Mint the entire allow list supply to different wallets
    await Promise.all(
      wallets.map((wallet) =>
        (async (wallet) => {
          const salt = "0x" + randomBytes(8).toString("hex");

          // State set up
          await ctx.jfContract.safeMintTo(wallet.address, 10); // Allowance 3 JFMC
          const quantity = await ctx.contract.MAX_BATCH_MINT();
          const jungle = ethers.utils.parseEther("0");

          const price = await mockContract.publicEthPrice(jungle, quantity);

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
              .publicMint(apiSignature, salt, jungle, quantity, {
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
      const quantity = await ctx.contract.MAX_BATCH_MINT();
      const jungle = ethers.utils.parseEther("0");

      const price = await mockContract.publicEthPrice(jungle, quantity);

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
          .publicMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("SoldOut");
    }

    expect(await mockContract.totalSupply()).to.eq(BigNumber.from(maxSupply));
  });

  describe("spending jungle", async () => {
    it("should allow when holding 1 jungle freak and spending 90 jungle", async () => {
      await ctx.jfContract.safeMintTo(ctx.user1.address, 1);
      await ctx.jungleContract.mint(
        ctx.user1.address,
        ethers.utils.parseEther("100")
      );
      await ctx.jungleContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.contract.address, true);

      quantity = 1;

      jungle = ethers.utils.parseEther("90");

      price = await ctx.contract.publicEthPrice(jungle, quantity);

      expect(price).to.eql(ethers.utils.parseEther("0.075"));

      apiSignature = await signMintRequest(
        ctx.signer,
        ctx.user1.address,
        salt,
        ["uint256", "uint8"],
        [jungle, quantity]
      );

      // Mint
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

      expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);

      expect(await ctx.jungleContract.balanceOf(jungleBank)).to.eq(
        ethers.utils.parseEther("90")
      );

      expect(await ctx.jungleContract.balanceOf(ctx.user1.address)).to.eq(
        ethers.utils.parseEther("10")
      );
    });

    it("should allow when holding 1 jungle freak and spending 900 jungle", async () => {
      await ctx.jfContract.safeMintTo(ctx.user1.address, 1);
      await ctx.jungleContract.mint(
        ctx.user1.address,
        ethers.utils.parseEther("1000")
      );
      await ctx.jungleContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.contract.address, true);

      quantity = 5;

      jungle = ethers.utils.parseEther("925");

      price = await ctx.contract.publicEthPrice(jungle, quantity);

      expect(price).to.eql(ethers.utils.parseEther("0.25"));

      apiSignature = await signMintRequest(
        ctx.signer,
        ctx.user1.address,
        salt,
        ["uint256", "uint8"],
        [jungle, quantity]
      );

      // Mint
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

      expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);

      expect(await ctx.jungleContract.balanceOf(jungleBank)).to.eq(
        ethers.utils.parseEther("925")
      );

      expect(await ctx.jungleContract.balanceOf(ctx.user1.address)).to.eq(
        ethers.utils.parseEther("75")
      );
    });

    it("should allow when holding 5 jungle freak and spending 750 jungle", async () => {
      await ctx.jfContract.safeMintTo(ctx.user1.address, 5);
      await ctx.jungleContract.mint(
        ctx.user1.address,
        ethers.utils.parseEther("750")
      );
      await ctx.jungleContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.contract.address, true);

      quantity = 2;

      jungle = ethers.utils.parseEther("750");

      price = await ctx.contract.publicEthPrice(jungle, quantity);

      expect(price).to.eql(ethers.utils.parseEther("0.00"));

      apiSignature = await signMintRequest(
        ctx.signer,
        ctx.user1.address,
        salt,
        ["uint256", "uint8"],
        [jungle, quantity]
      );

      // Mint
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

      expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);

      expect(await ctx.jungleContract.balanceOf(jungleBank)).to.eq(
        ethers.utils.parseEther("750")
      );

      expect(await ctx.jungleContract.balanceOf(ctx.user1.address)).to.eq(
        ethers.utils.parseEther("0")
      );
    });

    it("should fail when holding 5 jungle freak and spending 750 jungle because of not enough jungle", async () => {
      await ctx.jfContract.safeMintTo(ctx.user1.address, 5);
      await ctx.jungleContract.mint(
        ctx.user1.address,
        ethers.utils.parseEther("749")
      );
      await ctx.jungleContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.contract.address, true);

      quantity = 2;

      jungle = ethers.utils.parseEther("750");

      price = await ctx.contract.publicEthPrice(jungle, quantity);

      expect(price).to.eql(ethers.utils.parseEther("0.00"));

      apiSignature = await signMintRequest(
        ctx.signer,
        ctx.user1.address,
        salt,
        ["uint256", "uint8"],
        [jungle, quantity]
      );

      // Mint
      await expect(
        ctx.contract
          .connect(ctx.user1)
          .publicMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("should fail when holding 5 jungle freak and spending 925 jungle because of not enough ether", async () => {
      await ctx.jfContract.safeMintTo(ctx.user1.address, 1);
      await ctx.jungleContract.mint(
        ctx.user1.address,
        ethers.utils.parseEther("1000")
      );
      await ctx.jungleContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.contract.address, true);

      quantity = 5;

      jungle = ethers.utils.parseEther("925");

      price = await ctx.contract.publicEthPrice(jungle, quantity);

      expect(price).to.eql(ethers.utils.parseEther("0.25"));

      price = ethers.utils.parseEther("0.15");

      apiSignature = await signMintRequest(
        ctx.signer,
        ctx.user1.address,
        salt,
        ["uint256", "uint8"],
        [jungle, quantity]
      );

      // Mint
      await expect(
        ctx.contract
          .connect(ctx.user1)
          .publicMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("IncorrectEthValue");
    });

    it("should fail because of incorrect jungle", async () => {
      await ctx.jfContract.safeMintTo(ctx.user1.address, 5);
      await ctx.jungleContract.mint(
        ctx.user1.address,
        ethers.utils.parseEther("750")
      );
      await ctx.jungleContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.contract.address, true);

      quantity = 2;

      jungle = ethers.utils.parseEther("750");

      price = await ctx.contract.publicEthPrice(jungle, quantity);

      expect(price).to.eql(ethers.utils.parseEther("0.00"));

      jungle = ethers.utils.parseEther("749");

      apiSignature = await signMintRequest(
        ctx.signer,
        ctx.user1.address,
        salt,
        ["uint256", "uint8"],
        [jungle, quantity]
      );

      // Mint
      await expect(
        ctx.contract
          .connect(ctx.user1)
          .publicMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("IncorrectValueJungle");
    });
  });
}
