import { expect } from "chai";
import { randomBytes } from "crypto";
import { BigNumber, Wallet } from "ethers";
import { ethers } from "hardhat";
import keccak256 from "keccak256";
import MerkleTree from "merkletreejs";
import signMintRequest from "../../utils/signMintRequest";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  let merkleProof: string[];
  let salt: string;
  let apiSignature: string;
  let price: BigNumber;
  let quantity: number;
  beforeEach(async function () {
    quantity = 2;
    const root = ctx.merkleTree.getHexRoot();
    await ctx.contract.setMerkleRoot(root);

    const leaf = ctx.leavesLookup[ctx.user1.address];
    merkleProof = ctx.merkleTree.getHexProof(leaf);

    salt = "0x" + randomBytes(8).toString("hex");
    price = await ctx.contract.SALE_PRICE();
    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["bytes32[]", "uint8"],
      [merkleProof, quantity]
    );

    await expect(ctx.contract.startAllowListMint()).to.emit(
      ctx.contract,
      "AllowListMintBegins"
    );
  });

  it("should allow minting with a valid signature and merkle proof", async () => {
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

    expect(await ctx.contract.ownerOf(0)).to.be.eq(ctx.user1.address);
  });

  it("should mint because user has a staked token", async () => {
    // State set up
    await ctx.jfContract.safeMintTo(ctx.user1.address, 1); // Allowance 1 JFMC
    // Setting up staking across the contracts
    await ctx.jungleContract.toggle();
    await ctx.jfContract
      .connect(ctx.user1)
      .setApprovalForAll(ctx.jungleContract.address, true);
    await ctx.jungleContract.connect(ctx.user1).stakeById([0]);

    merkleProof = [];

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["bytes32[]", "uint8"],
      [merkleProof, quantity]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .allowListMint(apiSignature, salt, merkleProof, quantity, {
          value: price.mul(quantity),
        })
    ).to.emit(ctx.contract, "Transfer");
  });

  it("should mint because user has a staked legendary token", async () => {
    // State set up
    await ctx.jflContract.mintTo(ctx.user1.address, ctx.legendaryCOFT, 1); // Allowance 1 JFMC
    // Setting up staking across the contracts
    await ctx.jungleContract.toggle();
    await ctx.jflContract
      .connect(ctx.user1)
      .setApprovalForAll(ctx.jungleContract.address, true);
    await ctx.jungleContract.connect(ctx.user1).stakeLegendaries(1, 0);

    merkleProof = [];

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["bytes32[]", "uint8"],
      [merkleProof, quantity]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .allowListMint(apiSignature, salt, merkleProof, quantity, {
          value: price.mul(quantity),
        })
    ).to.emit(ctx.contract, "Transfer");
  });

  it("should fail to mint when over 2 per transaction", async () => {
    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .allowListMint(apiSignature, salt, merkleProof, quantity, {
          value: price.mul(quantity),
        })
    ).to.emit(ctx.contract, "Transfer");

    quantity = 3;

    salt = "0x" + randomBytes(8).toString("hex");

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["bytes32[]", "uint8"],
      [merkleProof, quantity]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .allowListMint(apiSignature, salt, merkleProof, quantity, {
          value: price.mul(quantity),
        })
    ).to.be.revertedWith("TransactionMintLimit");

    quantity = 2;

    salt = "0x" + randomBytes(8).toString("hex");

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["bytes32[]", "uint8"],
      [merkleProof, quantity]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .allowListMint(apiSignature, salt, merkleProof, quantity, {
          value: price.mul(quantity),
        })
    ).to.emit(ctx.contract, "Transfer");
  });

  it("should fail to mint from invalid merkle proof", async () => {
    const leaf = ctx.leavesLookup[ctx.user2.address];
    merkleProof = ctx.merkleTree.getHexProof(leaf);

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["bytes32[]", "uint8"],
      [merkleProof, quantity]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .allowListMint(apiSignature, salt, merkleProof, quantity, {
          value: price.mul(quantity),
        })
    ).to.be.revertedWith("ProofFailed");
  });

  it("should fail to mint from empty merkle proof", async () => {
    merkleProof = [];

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["bytes32[]", "uint8"],
      [merkleProof, quantity]
    );

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .allowListMint(apiSignature, salt, merkleProof, quantity, {
          value: price.mul(quantity),
        })
    ).to.be.revertedWith("ProofFailed");
  });

  it("should fail to mint from invalid price", async () => {
    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .allowListMint(apiSignature, salt, merkleProof, quantity, {
          value: price.sub(ethers.utils.parseEther("0.01")),
        })
    ).to.be.revertedWith("IncorrectEthValue");

    // Mint
    await expect(
      ctx.contract
        .connect(ctx.user1)
        .allowListMint(apiSignature, salt, merkleProof, quantity, {
          value: price.add(ethers.utils.parseEther("0.01")),
        })
    ).to.be.revertedWith("IncorrectEthValue");
  });

  it("should mint only ALLOW_LIST_SUPPLY with valid signature and merkle proof", async () => {
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
    const allowListSupply = 5;
    await mockContract.setVariable("ALLOW_LIST_SUPPLY", 10);

    // Start allow list minting phase
    await mockContract.startAllowListMint();

    // Generate allowListSupply + 1 wallets
    const wallets = new Array(allowListSupply + 1)
      .fill("")
      .map((_) => ethers.Wallet.createRandom().connect(ethers.provider));

    const leavesLookup = Object.fromEntries(
      wallets.map((wallet: Wallet) => [
        wallet.address,
        ethers.utils.solidityKeccak256(["address"], [wallet.address]),
      ])
    );

    const merkleTree = new MerkleTree(Object.values(leavesLookup), keccak256, {
      sortPairs: true,
    });

    // Set the merkle root on the contract
    const root = merkleTree.getHexRoot();
    await mockContract.setMerkleRoot(root);

    const quantity = 2;

    // Mint the entire allow list supply to different wallets
    await Promise.all(
      wallets.slice(0, allowListSupply).map((wallet) =>
        (async (wallet) => {
          const tx = await ctx.owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("0.5"),
          });
          await tx.wait();

          const salt = "0x" + randomBytes(8).toString("hex");

          const leaf = leavesLookup[wallet.address];
          const merkleProof = merkleTree.getHexProof(leaf);

          const apiSignature = await signMintRequest(
            ctx.signer,
            wallet.address,
            salt,
            ["bytes32[]", "uint8"],
            [merkleProof, quantity]
          );

          return expect(
            mockContract
              .connect(wallet)
              .allowListMint(apiSignature, salt, merkleProof, quantity, {
                value: price.mul(quantity),
              })
          ).to.not.be.reverted;
        })(wallet)
      )
    );

    // Minting 1 more than Allowed
    {
      const wallet = wallets[wallets.length - 1];
      const tx = await ctx.owner.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("0.5"),
      });
      await tx.wait();

      const salt = "0x" + randomBytes(8).toString("hex");

      const leaf = leavesLookup[wallet.address];
      const merkleProof = merkleTree.getHexProof(leaf);

      const apiSignature = await signMintRequest(
        ctx.signer,
        wallet.address,
        salt,
        ["bytes32[]", "uint8"],
        [merkleProof, quantity]
      );

      await expect(
        mockContract
          .connect(wallet)
          .allowListMint(apiSignature, salt, merkleProof, quantity, {
            value: price.mul(quantity),
          })
      ).to.be.revertedWith("AllowListSoldOut");
    }

    expect(await mockContract.totalSupply()).to.eq(
      BigNumber.from(allowListSupply * quantity)
    );
  });

  it("should mint only MAX_SUPPLY with valid signature and merkle proof", async () => {
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
    const maxSupply = 10;
    await mockContract.setVariable("MAX_SUPPLY", 10);
    await mockContract.setVariable("reserved", 0);

    // Start allow list minting phase
    await mockContract.startAllowListMint();

    // Generate allowListSupply + 1 wallets
    const wallets = new Array(maxSupply + 1)
      .fill("")
      .map((_) => ethers.Wallet.createRandom().connect(ethers.provider));

    const leavesLookup = Object.fromEntries(
      wallets.map((wallet: Wallet) => [
        wallet.address,
        ethers.utils.solidityKeccak256(["address"], [wallet.address]),
      ])
    );

    const merkleTree = new MerkleTree(Object.values(leavesLookup), keccak256, {
      sortPairs: true,
    });

    // Set the merkle root on the contract
    const root = merkleTree.getHexRoot();
    await mockContract.setMerkleRoot(root);

    const quantity = 1;

    // Mint the entire allow list supply to different wallets
    await Promise.all(
      wallets.slice(0, maxSupply).map((wallet) =>
        (async (wallet) => {
          const tx = await ctx.owner.sendTransaction({
            to: wallet.address,
            value: ethers.utils.parseEther("0.5"),
          });
          await tx.wait();

          const salt = "0x" + randomBytes(8).toString("hex");

          const leaf = leavesLookup[wallet.address];
          const merkleProof = merkleTree.getHexProof(leaf);

          const apiSignature = await signMintRequest(
            ctx.signer,
            wallet.address,
            salt,
            ["bytes32[]", "uint8"],
            [merkleProof, quantity]
          );

          return expect(
            mockContract
              .connect(wallet)
              .allowListMint(apiSignature, salt, merkleProof, quantity, {
                value: price.mul(quantity),
              })
          ).to.not.be.reverted;
        })(wallet)
      )
    );

    // Minting 1 more than Allowed
    {
      const wallet = wallets[wallets.length - 1];
      const tx = await ctx.owner.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("0.5"),
      });
      await tx.wait();

      const salt = "0x" + randomBytes(8).toString("hex");

      const leaf = leavesLookup[wallet.address];
      const merkleProof = merkleTree.getHexProof(leaf);

      const apiSignature = await signMintRequest(
        ctx.signer,
        wallet.address,
        salt,
        ["bytes32[]", "uint8"],
        [merkleProof, quantity]
      );

      await expect(
        mockContract
          .connect(wallet)
          .allowListMint(apiSignature, salt, merkleProof, quantity, {
            value: price.mul(quantity),
          })
      ).to.be.revertedWith("SoldOut");
    }

    expect(await mockContract.totalSupply()).to.eq(BigNumber.from(maxSupply));
  });

  describe("moderator permissions", async () => {
    it("can set merkle root", async () => {
      await expect(
        ctx.contract.connect(ctx.mod).setMerkleRoot(keccak256("MerkleRoot"))
      ).to.not.be.reverted;
    });

    it("fail to set merkle root when not owner or admin", async () => {
      await expect(
        ctx.contract.connect(ctx.user1).setMerkleRoot(keccak256("MerkleRoot"))
      ).to.be.revertedWith("NotModeratorOrOwner");
    });
  });
}
