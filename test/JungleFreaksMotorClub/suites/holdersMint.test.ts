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
  let quantity: number;
  let jungle: BigNumber;
  let apiSignature: string;
  let price: BigNumber;
  beforeEach(async function () {
    // Default mints
    salt = "0x" + randomBytes(8).toString("hex");

    await expect(ctx.contract.startHoldersMint()).to.emit(
      ctx.contract,
      "HoldersMintBegins"
    );
  });

  it("should allow holders minting with a valid signature", async () => {
    // State set up
    await ctx.jfContract.safeMintTo(ctx.user1.address, 1); // Allowance 1 JFMC

    quantity = 1;

    jungle = ethers.utils.parseEther("0");

    price = await ctx.contract.holdersEthPrice(jungle, quantity);

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

  describe("numbers of freaks", async () => {
    it("should allow when holding 1 freak", async () => {
      // State set up
      await ctx.jfContract.safeMintTo(ctx.user1.address, 1); // Allowance 1 JFMC

      quantity = 1;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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

    it("should allow when holding 5 freaks", async () => {
      // State set up
      await ctx.jfContract.safeMintTo(ctx.user1.address, 5); // Allowance 2 JFMC

      quantity = 2;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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

    it("should allow when holding 10 freaks", async () => {
      // State set up
      await ctx.jfContract.safeMintTo(ctx.user1.address, 10); // Allowance 3 JFMC

      quantity = 3;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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

    it("should fail to mint 2 JFMC when holding 1 freak", async () => {
      // State set up
      await ctx.jfContract.safeMintTo(ctx.user1.address, 1); // Allowance 1 JFMC

      quantity = 2;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("TransactionMintLimit");
    });

    it("should fail to mint 3 JFMC when holding 5 freak", async () => {
      // State set up
      await ctx.jfContract.safeMintTo(ctx.user1.address, 5); // Allowance 2 JFMC

      quantity = 3;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("TransactionMintLimit");
    });

    it("should fail to mint 4 JFMC when holding 10 freak", async () => {
      // State set up
      await ctx.jfContract.safeMintTo(ctx.user1.address, 10); // Allowance 3 JFMC

      quantity = 4;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("TransactionMintLimit");
    });
  });

  describe("numbers of legendary freaks", async () => {
    it("should allow when holding 1 legendary freak", async () => {
      // State set up: Allowance 1 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 1); // Allowance 1 JFMC

      quantity = 1;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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

    it("should allow when holding 5 legendary freaks", async () => {
      // State set up: Allowance 2 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 2);
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryMTFM, 3);

      quantity = 2;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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

    it("should allow when holding 10 legendary freaks", async () => {
      // State set up: Allowance 3 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 5);
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryMTFM, 5);

      quantity = 3;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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

    it("should fail to mint 2 JFMC when holding 1 freak", async () => {
      // State set up
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 1); // Allowance 1 JFMC

      quantity = 2;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("TransactionMintLimit");
    });

    it("should fail to mint 3 JFMC when holding 5 freak", async () => {
      // State set up: Allowance 2 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 2);
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryMTFM, 3);

      quantity = 3;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("TransactionMintLimit");
    });

    it("should fail to mint 4 JFMC when holding 10 freak", async () => {
      // State set up: Allowance 3 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 5);
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryMTFM, 5);

      quantity = 4;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("TransactionMintLimit");
    });
  });

  describe("numbers of mix freaks", async () => {
    it("should allow when holding 1 legendary freak & 1 jungle freak", async () => {
      // State set up: Allowance 1 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 1);
      await ctx.jfContract.safeMintTo(ctx.user1.address, 1);

      quantity = 1;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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

    it("should allow when holding 5 legendary freaks", async () => {
      // State set up: Allowance 2 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryMTFM, 3);
      await ctx.jfContract.safeMintTo(ctx.user1.address, 2);

      quantity = 2;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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

    it("should allow when holding 10 legendary freaks", async () => {
      // State set up: Allowance 3 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 3);
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryMTFM, 3);
      await ctx.jfContract.safeMintTo(ctx.user1.address, 4);

      quantity = 3;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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

    it("should fail to mint 2 JFMC when holding 1 freak", async () => {
      // State set up
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 1); // Allowance 1 JFMC

      quantity = 2;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("TransactionMintLimit");
    });

    it("should fail to mint 3 JFMC when holding 5 freak", async () => {
      // State set up: Allowance 2 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 2);
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryMTFM, 3);

      quantity = 3;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("TransactionMintLimit");
    });

    it("should fail to mint 4 JFMC when holding 10 freak", async () => {
      // State set up: Allowance 3 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 5);
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryMTFM, 5);

      quantity = 4;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("TransactionMintLimit");
    });
  });

  describe("numbers of staked freaks", async () => {
    it("should allow when holding 2 mixed freaks &  1 staked jungle freak", async () => {
      // State set up: Allowance 3 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 1);
      await ctx.jfContract.safeMintTo(ctx.user1.address, 1);

      await ctx.jungleContract.toggle();
      await ctx.jfContract
        .connect(ctx.user1)
        .setApprovalForAll(ctx.jungleContract.address, true);
      await ctx.jungleContract.connect(ctx.user1).stakeById([0]);

      quantity = 3;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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

    it("should allow when holding 5 mixed freaks & 1 staked jungle freak", async () => {
      // State set up: Allowance 4 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryMTFM, 3);
      await ctx.jfContract.safeMintTo(ctx.user1.address, 2);

      await ctx.jungleContract.toggle();
      await ctx.jfContract
        .connect(ctx.user1)
        .setApprovalForAll(ctx.jungleContract.address, true);
      await ctx.jungleContract.connect(ctx.user1).stakeById([0]);

      quantity = 4;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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

    it("should allow when holding 10 mixed freaks & 1 staked legendary freak", async () => {
      // State set up: Allowance 5 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 3);
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryMTFM, 3);
      await ctx.jfContract.safeMintTo(ctx.user1.address, 4);

      await ctx.jungleContract.toggle();
      await ctx.jflContract
        .connect(ctx.user1)
        .setApprovalForAll(ctx.jungleContract.address, true);
      await ctx.jungleContract.connect(ctx.user1).stakeLegendaries(0, 1);

      quantity = 5;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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

    it("should fail to mint 4 JFMC when holding 2 mixed freaks + 1 staked jungle freak", async () => {
      // State set up: Allowance 3 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 1);
      await ctx.jfContract.safeMintTo(ctx.user1.address, 1);

      await ctx.jungleContract.toggle();
      await ctx.jfContract
        .connect(ctx.user1)
        .setApprovalForAll(ctx.jungleContract.address, true);
      await ctx.jungleContract.connect(ctx.user1).stakeById([0]);

      quantity = 4;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("TransactionMintLimit");
    });

    it("should fail to mint 5 JFMC when holding 5 mixed freaks & 1 staked jungle freak", async () => {
      // State set up: Allowance 4 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryMTFM, 3);
      await ctx.jfContract.safeMintTo(ctx.user1.address, 2);

      await ctx.jungleContract.toggle();
      await ctx.jfContract
        .connect(ctx.user1)
        .setApprovalForAll(ctx.jungleContract.address, true);
      await ctx.jungleContract.connect(ctx.user1).stakeById([0]);

      quantity = 5;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("TransactionMintLimit");
    });

    it("should fail to mint 6 JFMC when holding 10 mixed freaks & 1 staked legendary", async () => {
      // State set up: Allowance 5 JFMC
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 3);
      await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryMTFM, 3);
      await ctx.jfContract.safeMintTo(ctx.user1.address, 4);

      await ctx.jungleContract.toggle();
      await ctx.jflContract
        .connect(ctx.user1)
        .setApprovalForAll(ctx.jungleContract.address, true);
      await ctx.jungleContract.connect(ctx.user1).stakeLegendaries(0, 1);

      quantity = 6;

      jungle = ethers.utils.parseEther("0");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("TransactionMintLimit");
    });
  });

  it("should revert with a NotHoldingJungleFreaks message", async () => {
    quantity = 2;

    jungle = ethers.utils.parseEther("0");

    price = await ctx.contract.holdersEthPrice(jungle, quantity);

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user9.address,
      salt,
      ["uint256", "uint8"],
      [jungle, quantity]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user9)
        .holdersMint(apiSignature, salt, jungle, quantity, {
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
    const maxSupply = 15;
    await mockContract.setVariable("MAX_SUPPLY", maxSupply);
    await mockContract.setVariable("reserved", 0);

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

      quantity = 1;

      jungle = ethers.utils.parseEther("75");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

      expect(price).to.eql(ethers.utils.parseEther("0.06"));

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.emit(ctx.contract, "Transfer");

      expect(
        (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
      ).to.be.eq(quantity);

      expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);

      expect(await ctx.jungleContract.balanceOf(jungleBank)).to.eq(
        ethers.utils.parseEther("75")
      );

      expect(await ctx.jungleContract.balanceOf(ctx.user1.address)).to.eq(
        ethers.utils.parseEther("75")
      );
    });

    it("should allow when holding 10 jungle freak and spending 900 jungle", async () => {
      await ctx.jfContract.safeMintTo(ctx.user1.address, 10);
      await ctx.jungleContract.mint(
        ctx.user1.address,
        ethers.utils.parseEther("900")
      );
      await ctx.jungleContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.contract.address, true);

      quantity = 3;

      jungle = ethers.utils.parseEther("900");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.emit(ctx.contract, "Transfer");

      expect(
        (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
      ).to.be.eq(quantity);

      expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);

      expect(await ctx.jungleContract.balanceOf(jungleBank)).to.eq(
        ethers.utils.parseEther("900")
      );

      expect(await ctx.jungleContract.balanceOf(ctx.user1.address)).to.eq(
        ethers.utils.parseEther("0")
      );
    });

    it("should allow when holding 5 jungle freak and spending 300 jungle", async () => {
      await ctx.jfContract.safeMintTo(ctx.user1.address, 5);
      await ctx.jungleContract.mint(
        ctx.user1.address,
        ethers.utils.parseEther("300")
      );
      await ctx.jungleContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.contract.address, true);

      quantity = 2;

      jungle = ethers.utils.parseEther("300");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

      expect(price).to.eql(ethers.utils.parseEther("0.08"));

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.emit(ctx.contract, "Transfer");

      expect(
        (await ctx.contract.balanceOf(ctx.user1.address)).toNumber()
      ).to.be.eq(quantity);

      expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);

      expect(await ctx.jungleContract.balanceOf(jungleBank)).to.eq(
        ethers.utils.parseEther("300")
      );

      expect(await ctx.jungleContract.balanceOf(ctx.user1.address)).to.eq(
        ethers.utils.parseEther("0")
      );
    });

    it("should fail when holding 5 jungle freak and spending 300 jungle because of not enough jungle", async () => {
      await ctx.jfContract.safeMintTo(ctx.user1.address, 5);
      await ctx.jungleContract.mint(
        ctx.user1.address,
        ethers.utils.parseEther("275")
      );
      await ctx.jungleContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.contract.address, true);

      quantity = 2;

      jungle = ethers.utils.parseEther("300");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

      expect(price).to.eql(ethers.utils.parseEther("0.08"));

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("should fail because of incorrect jungle", async () => {
      await ctx.jfContract.safeMintTo(ctx.user1.address, 5);
      await ctx.jungleContract.mint(
        ctx.user1.address,
        ethers.utils.parseEther("300")
      );
      await ctx.jungleContract
        .connect(ctx.user1)
        .setAuthorizedAddress(ctx.contract.address, true);

      quantity = 2;

      jungle = ethers.utils.parseEther("300");

      price = await ctx.contract.holdersEthPrice(jungle, quantity);

      expect(price).to.eql(ethers.utils.parseEther("0.08"));

      jungle = ethers.utils.parseEther("250");

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
          .holdersMint(apiSignature, salt, jungle, quantity, {
            value: price,
          })
      ).to.be.revertedWith("IncorrectValueJungle");
    });
  });
}
