import * as dotenv from "dotenv";
import hre, { ethers } from "hardhat";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import {
  contractDeployment,
  etherscanVerification,
  keypress,
  writeContractData,
} from "./utils";
import { BigNumber } from "ethers";
import {
  JungleFreaksMotorClub,
  JungleFreaksMotorClubRoyaltyReceiver,
} from "../typechain";

dotenv.config();

const network = hre.network.name;

// Settings //////////////////////////////////////////////////////////////

const settingsNetwork = "mainnet";

const contractOwner = { address: "0x8e5F332a0662C8c06BDD1Eed105Ba1C4800d4c2f" };
const contractSigner = {
  address: "0xd497c27C285E9D32cA316E8D9B4CCd735dEe4C15",
};

const jfContract = { address: "0x7e6bc952d4b4bd814853301bee48e99891424de0" };
const jflContract = { address: "0x495f947276749ce646f68ac8c248420045cb7b5e" };
const jungleContract = {
  address: "0x4d648c35212273d638a5e602ab1177bb75ad7946",
};

const merkleRoot =
  "0xf81b9999e2766587723ad4d3506abc5fb371a5500163caa3522c933208e0c7a4";

const date = new Date().toJSON().slice(0, 10);
const dir = `deployment/${network}`;
const filename = `deployment-${date}.json`;

/////////////////////////////////////////////////////////////////////////

async function main() {
  // Global(ish) vars
  const contractDeployer = new LedgerSigner(hre.ethers.provider);
  await contractDeployer.getAddress().catch((e) => {
    console.log("\nERROR: Ledger needs to be unlocked\n");
    process.exit(1);
  });
  await contractDeployer.getChainId().catch((e) => {
    console.log("\nERROR: Open Etheruem app on the Ledger.\n");
    process.exit(1);
  });

  if (["hardhat", "localhost"].includes(network)) {
    const [testUser] = await ethers.getSigners();
    testUser.sendTransaction({
      to: await contractDeployer.getAddress(),
      value: ethers.utils.parseEther("200"),
    });
  }

  let initialBalance: BigNumber;
  let currentBalance: BigNumber;
  let rrContract: JungleFreaksMotorClubRoyaltyReceiver;
  let contract: JungleFreaksMotorClub;

  console.log("***************************");
  console.log("*   Contract Deployment   *");
  console.log("***************************");
  console.log("\n");

  // Confirm Settings
  {
    console.log("Settings");
    console.log("Network:", network, settingsNetwork == network);
    console.log(
      "Contract Owner Address:",
      contractOwner.address,
      ethers.utils.isAddress(contractOwner.address)
    );
    console.log("\n");

    writeContractData(dir, filename, {
      date,
      network,
      contractOwnerAddress: contractOwner.address,
      signerAddress: contractSigner.address,
    });

    await keypress();
  }

  // Confirm Deployer
  {
    initialBalance = await contractDeployer.getBalance();

    console.log("Deployment Wallet");
    console.log("Address:", await contractDeployer.getAddress());
    console.log("Chainid: ", await contractDeployer.getChainId());
    console.log("Balance:", ethers.utils.formatEther(initialBalance), "Ether");
    console.log("\n");

    writeContractData(dir, filename, {
      deployerAddress: await contractDeployer.getAddress(),
    });

    await keypress();
  }

  // Royalty Receiver Deployment
  {
    rrContract = (await contractDeployment(
      contractDeployer,
      "JungleFreaksMotorClubRoyaltyReceiver",
      "Royalty Receiver"
    )) as JungleFreaksMotorClubRoyaltyReceiver;

    writeContractData(dir, filename, {
      royaltyReceiverAddress: rrContract.address,
    });

    // Verify on etherscan
    await etherscanVerification(rrContract.address);

    await keypress();
  }

  // Main Contract Deployment
  {
    const args = [
      contractSigner.address,
      await contractDeployer.getAddress(),
      rrContract.address,
      jfContract.address,
      jflContract.address,
      jungleContract.address,
    ];
    contract = (await contractDeployment(
      contractDeployer,
      "JungleFreaksMotorClub",
      "Jungle Freaks Motor Club",
      args
    )) as JungleFreaksMotorClub;

    writeContractData(dir, filename, {
      contractAddress: contract.address,
      contractArguments: args,
    });

    // Verify on etherscan
    await etherscanVerification(contract.address, args);

    await keypress();
  }

  // Extra settings
  {
    console.log("Set Merkle Root");

    await keypress("Press any key to continue or ctrl-C to cancel");
    const tx = await contract
      .connect(contractDeployer)
      .setMerkleRoot(merkleRoot);
    console.log("merkle root tx hash:", tx.hash);
    await tx.wait();

    await keypress();
  }

  // Transfer ownership
  {
    console.log("Transfer Ownership to: " + contractOwner.address);

    await keypress("Press any key to continue and ctrl-C to cancel");
    const rrTx = await rrContract
      .connect(contractDeployer)
      .transferOwnership(contractOwner.address);
    console.log("Royalty Receiver owner tx hash:", rrTx.hash);
    await rrTx.wait();

    const Tx = await contract
      .connect(contractDeployer)
      .transferOwnership(contractOwner.address);
    console.log("JFMC owner tx hash:", rrTx.hash);
    await Tx.wait();
  }

  // Deployment Costs
  {
    currentBalance = await contractDeployer.getBalance();
    console.log(
      "Deployment Cost:",
      ethers.utils.formatEther(initialBalance.sub(currentBalance)),
      "Ether"
    );
    console.log("\n");

    writeContractData(dir, filename, {
      deploymentCost: ethers.utils.formatEther(
        initialBalance.sub(currentBalance)
      ),
    });

    console.log("Completed Successfully");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
