import { expect } from "chai";
import { ethers } from "hardhat";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  describe("When receiving ether", async () => {
    it("should allow contract to receive ether", async () => {
      const value = ethers.utils.parseEther("1");

      await expect(
        ctx.owner.sendTransaction({
          to: ctx.contract.address,
          value,
        })
      ).to.not.be.reverted;
    });
  });

  describe("When setting withdrawal addresses", async () => {
    it("should return the correct default withdrawal address when no withdrawal address has been set for Jungle Freaks", async () => {
      expect(await ctx.contract.user1()).to.eql(
        "0x8e5F332a0662C8c06BDD1Eed105Ba1C4800d4c2f"
      );
    });

    it("should return the correct default withdrawal address when no withdrawal address has been set for Scott A", async () => {
      expect(await ctx.contract.user2()).to.eql(
        "0x954BfE5137c8D2816cE018EFd406757f9a060e5f"
      );
    });

    it("should return the correct default withdrawal address when no withdrawal address has been set for Scott T", async () => {
      expect(await ctx.contract.user3()).to.eql(
        "0x2E7D93e2AdFC4a36E2B3a3e23dE7c35212471CfB"
      );
    });

    it("should return the correct default withdrawal address when no withdrawal address has been set for Will Fan", async () => {
      expect(await ctx.contract.user4()).to.eql(
        "0x6fA183959B387a57b4869eAa34c2540Ff237886F"
      );
    });

    it("should return the correct default withdrawal address when no withdrawal address has been set for Netvrk", async () => {
      expect(await ctx.contract.user5()).to.eql(
        "0x901FC05c4a4bC027a8979089D716b6793052Cc16"
      );
    });

    it("should return the correct default withdrawal address when no withdrawal address has been set for Massless", async () => {
      expect(await ctx.contract.user6()).to.eql(
        "0xd196e0aFacA3679C27FC05ba8C9D3ABBCD353b5D"
      );
    });

    it("should set the withdrawal address for Jungle Freaks", async () => {
      await expect(ctx.contract.setUser1(ctx.user1.address)).to.not.be.reverted;
    });

    it("should fail to set the Jungle Freaks withdrawal address because user is not owner", async () => {
      await expect(
        ctx.contract.connect(ctx.user1).setUser1(ctx.user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        ctx.contract.connect(ctx.user1).setUser2(ctx.user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        ctx.contract.connect(ctx.user1).setUser3(ctx.user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        ctx.contract.connect(ctx.user1).setUser4(ctx.user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        ctx.contract.connect(ctx.user1).setUser5(ctx.user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        ctx.contract.connect(ctx.user1).setUser6(ctx.user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("When withdrawing Ether Funds", async () => {
    it("should fail to withdraw when balance is zero", async () => {
      await expect(ctx.contract.withdrawEth()).to.be.revertedWith(
        "ZeroBalance"
      );
    });

    it("should fail to withdraw when there is a wallet error", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");
      await expect(
        ctx.owner.sendTransaction({
          to: ctx.contract.address,
          value,
        })
      ).to.not.be.reverted;

      await expect(ctx.contract.setUser6(ctx.brokenWallet.address)).to.not.be
        .reverted;

      await expect(ctx.contract.withdrawEth()).to.be.revertedWith(
        "WithdrawalFailedUser6"
      );

      await expect(ctx.contract.setUser5(ctx.brokenWallet.address)).to.not.be
        .reverted;

      await expect(ctx.contract.withdrawEth()).to.be.revertedWith(
        "WithdrawalFailedUser5"
      );

      await expect(ctx.contract.setUser4(ctx.brokenWallet.address)).to.not.be
        .reverted;

      await expect(ctx.contract.withdrawEth()).to.be.revertedWith(
        "WithdrawalFailedUser4"
      );

      await expect(ctx.contract.setUser3(ctx.brokenWallet.address)).to.not.be
        .reverted;

      await expect(ctx.contract.withdrawEth()).to.be.revertedWith(
        "WithdrawalFailedUser3"
      );

      await expect(ctx.contract.setUser2(ctx.brokenWallet.address)).to.not.be
        .reverted;

      await expect(ctx.contract.withdrawEth()).to.be.revertedWith(
        "WithdrawalFailedUser2"
      );
      await expect(ctx.contract.setUser1(ctx.brokenWallet.address)).to.not.be
        .reverted;

      await expect(ctx.contract.withdrawEth()).to.be.revertedWith(
        "WithdrawalFailedUser1"
      );
    });

    it("should allow anyone to initiate withdrawEth()", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        ctx.owner.sendTransaction({
          to: ctx.contract.address,
          value,
        })
      ).to.not.be.reverted;

      await expect(ctx.contract.connect(ctx.user1).withdrawEth()).to.not.be
        .reverted;
    });

    it("should withdraw contract balance to the default withdrawal addresses.", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        ctx.owner.sendTransaction({
          to: ctx.contract.address,
          value,
        })
      ).to.not.be.reverted;

      await expect(ctx.contract.withdrawEth()).to.be.not.be.reverted;
    });

    it("should withdraw contract balance to the correct withdrawal addresses.", async () => {
      const teamMemberAInitialBalance = await ctx.user1.getBalance();
      const teamMemberBInitialBalance = await ctx.user2.getBalance();
      const teamMemberCInitialBalance = await ctx.user3.getBalance();
      const teamMemberDInitialBalance = await ctx.user4.getBalance();
      const teamMemberEInitialBalance = await ctx.user5.getBalance();
      const teamMemberFInitialBalance = await ctx.user6.getBalance();

      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        ctx.owner.sendTransaction({
          to: ctx.contract.address,
          value,
        })
      ).to.not.be.reverted;

      await expect(ctx.contract.setUser1(ctx.user1.address)).to.not.be.reverted;

      await expect(ctx.contract.setUser2(ctx.user2.address)).to.not.be.reverted;

      await expect(ctx.contract.setUser3(ctx.user3.address)).to.not.be.reverted;

      await expect(ctx.contract.setUser4(ctx.user4.address)).to.not.be.reverted;

      await expect(ctx.contract.setUser5(ctx.user5.address)).to.not.be.reverted;

      await expect(ctx.contract.setUser6(ctx.user6.address)).to.not.be.reverted;

      await expect(ctx.contract.withdrawEth()).to.be.not.be.reverted;

      expect(await ctx.user1.getBalance()).to.equal(
        teamMemberAInitialBalance.add(value.mul(4000).div(10000)) // 40.00%
      );
      expect(await ctx.user2.getBalance()).to.equal(
        teamMemberBInitialBalance.add(value.mul(1500).div(10000)) // 15.00%
      );
      expect(await ctx.user3.getBalance()).to.equal(
        teamMemberCInitialBalance.add(value.mul(1000).div(10000)) // 10.00%
      );
      expect(await ctx.user4.getBalance()).to.equal(
        teamMemberDInitialBalance.add(value.mul(500).div(10000)) // 5.00%
      );
      expect(await ctx.user5.getBalance()).to.equal(
        teamMemberEInitialBalance.add(value.mul(1000).div(10000)) // 10.00%
      );
      expect(await ctx.user6.getBalance()).to.be.closeTo(
        teamMemberFInitialBalance.add(value.mul(2000).div(10000)), // 20.00%
        10
      );
    });
  });

  describe("When withdrawing ERC20 Funds", async () => {
    it("should fail to withdraw when balance is zero", async () => {
      await expect(
        ctx.contract.withdrawErc20(ctx.standardERC20.address)
      ).to.be.revertedWith("ZeroBalance");
    });

    it("should allow anyone to initiate withdrawErc20(standardERC20.address)", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        ctx.standardERC20
          .connect(ctx.approved)
          .transfer(ctx.contract.address, value)
      ).to.not.be.reverted;

      await expect(
        ctx.contract.connect(ctx.user1).withdrawErc20(ctx.standardERC20.address)
      ).to.not.be.reverted;
    });

    it("should withdraw contract balance to the default withdrawal addresses.", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        ctx.standardERC20
          .connect(ctx.approved)
          .transfer(ctx.contract.address, value)
      ).to.not.be.reverted;

      await expect(ctx.contract.withdrawErc20(ctx.standardERC20.address)).to.be
        .not.be.reverted;
    });

    it("should withdraw contract balance to the correct withdrawal addresses.", async () => {
      const teamMemberAInitialBalance = await ctx.standardERC20.balanceOf(
        ctx.user1.address
      );
      const teamMemberBInitialBalance = await ctx.standardERC20.balanceOf(
        ctx.user2.address
      );
      const teamMemberCInitialBalance = await ctx.standardERC20.balanceOf(
        ctx.user3.address
      );
      const teamMemberDInitialBalance = await ctx.standardERC20.balanceOf(
        ctx.user4.address
      );
      const teamMemberEInitialBalance = await ctx.standardERC20.balanceOf(
        ctx.user5.address
      );
      const teamMemberFInitialBalance = await ctx.standardERC20.balanceOf(
        ctx.user6.address
      );

      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        ctx.standardERC20
          .connect(ctx.approved)
          .transfer(ctx.contract.address, value)
      ).to.not.be.reverted;

      await expect(ctx.contract.setUser1(ctx.user1.address)).to.not.be.reverted;

      await expect(ctx.contract.setUser2(ctx.user2.address)).to.not.be.reverted;

      await expect(ctx.contract.setUser3(ctx.user3.address)).to.not.be.reverted;

      await expect(ctx.contract.setUser4(ctx.user4.address)).to.not.be.reverted;

      await expect(ctx.contract.setUser5(ctx.user5.address)).to.not.be.reverted;

      await expect(ctx.contract.setUser6(ctx.user6.address)).to.not.be.reverted;

      await expect(ctx.contract.withdrawErc20(ctx.standardERC20.address)).to.be
        .not.be.reverted;

      expect(await ctx.standardERC20.balanceOf(ctx.user1.address)).to.equal(
        teamMemberAInitialBalance.add(value.mul(4000).div(10000)) // 40.00%
      );
      expect(await ctx.standardERC20.balanceOf(ctx.user2.address)).to.equal(
        teamMemberBInitialBalance.add(value.mul(1500).div(10000)) // 15.00%
      );
      expect(await ctx.standardERC20.balanceOf(ctx.user3.address)).to.equal(
        teamMemberCInitialBalance.add(value.mul(1000).div(10000)) // 10.00%
      );
      expect(await ctx.standardERC20.balanceOf(ctx.user4.address)).to.equal(
        teamMemberDInitialBalance.add(value.mul(500).div(10000)) // 5.00%
      );
      expect(await ctx.standardERC20.balanceOf(ctx.user5.address)).to.equal(
        teamMemberEInitialBalance.add(value.mul(1000).div(10000)) // 10.00%
      );
      expect(
        await ctx.standardERC20.balanceOf(ctx.user6.address)
      ).to.be.closeTo(
        teamMemberFInitialBalance.add(value.mul(2000).div(10000)), // 20.00%
        10
      );
    });
  });
}
