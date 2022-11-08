import { expect } from "chai";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  it("should support supporting interfaces", async () => {
    const ERC165InterfaceId = "0x01ffc9a7"; // type(IERC165).interfaceId

    expect(await ctx.contract.supportsInterface(ERC165InterfaceId)).to.equal(
      true
    );
  });

  it("should support ERC721 Interface", async () => {
    const ERC721InterfaceId = "0x80ac58cd"; // type(IERC721).interfaceId

    expect(await ctx.contract.supportsInterface(ERC721InterfaceId)).to.equal(
      true
    );
  });

  it("should support ERC721 Metadata Interface", async () => {
    const ERC721MetadataInterfaceId = "0x5b5e139f"; // type(IERC721Metadata).interfaceId

    expect(
      await ctx.contract.supportsInterface(ERC721MetadataInterfaceId)
    ).to.equal(true);
  });

  it("should support ERC721 Enumerable Interface", async () => {
    const ERC721EnumerableInterfaceId = "0x780e9d63"; // type(IERC721Enumerable).interfaceId

    expect(
      await ctx.contract.supportsInterface(ERC721EnumerableInterfaceId)
    ).to.equal(true);
  });

  it("should support ContractURI Interface", async () => {
    const ContractURIInterfaceId = "0xe8a3d485"; // type(IContractURI).interfaceId

    expect(
      await ctx.contract.supportsInterface(ContractURIInterfaceId)
    ).to.equal(true);
  });

  it("should support ERC2981 Interface", async () => {
    const ERC2981InterfaceId = "0x2a55205a"; // type(IERC2981).interfaceId

    expect(await ctx.contract.supportsInterface(ERC2981InterfaceId)).to.equal(
      true
    );
  });
}
