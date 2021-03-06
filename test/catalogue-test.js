const chai = require("chai");
const Catalogue = require("../src/productCatalogue");
const Product = require("../src/product");

const expect = chai.expect;
let cat = null;
let batch = null;

describe("Catalogue", () => {
  beforeEach( () => {
    cat = new Catalogue("Test Catalogue");
    cat.addProduct(new Product("A123", "Product 1", 100, 10, 10.0));
    cat.addProduct(new Product("A124", "Product 2", 100, 10, 10.0));
    cat.addProduct(new Product("A125", "Product 3", 100, 10, 10.0));
  });
  describe("findProductById", function () {
    it("should find a valid product id", function () {
      const result = cat.findProductById("A123");
      expect(result.name).to.equal("Product 1");
    });
    it("should return undefined for invalid product id", function () {
      const result = cat.findProductById("A321");
      expect(result).to.be.undefined;
    });
  });
  describe("removeProductById", () => {
    it("should remove product with a valid id", () => {
      let result = cat.removeProductById("A123");
      expect(result.id).to.equal("A123");
      // Check target state
      result = cat.findProductById("A123");
      expect(result).to.be.undefined;
    });
    it("should return undefined when asked to remove invalid product", () => {
      const result = cat.removeProductById("A321");
      expect(result).to.be.undefined;
    });
  });
  describe("checkReorder",() => {
    it("should return array when no products need reordering",function(){
       const result = cat.checkReorders();
       expect(result.productIds).to.be.empty;
    });//(Normal) Currently no product needs to be reordered.

    it("should report products that satisfy reorder criteria", function () {
      cat.addProduct(new Product("B123", "Product 4", 10, 20, 10.0));
      cat.addProduct(new Product("B124", "Product 5", 10, 30, 10.0));
      const result = cat.checkReorders();
      expect(result.productIds).to.have.lengthOf(2);
      expect(result.productIds).to.have.members(["B123", "B124"]);
     }); // (Normal) Some products in the catalogue need reordering.

     it("should include products just on their reorder level", function () {
      cat.addProduct(new Product("B125", "Product 6", 10, 10, 10.0));
      const result = cat.checkReorders();
      expect(result.productIds).to.have.members(["B125"]);
    });//(Exceptional/Boundary) At least one product is on the boundary of its reorder state (quantity in stock == reorder level)

    it("should handle an empty catalogue",function(){
      cat=new Catalogue("pineapple");
      const result = cat.checkReorders();
      expect(result.productIds).to.be.empty;
    });//(Exceptional/Boundary) The catalogue's product list is empty.
  });
  
  describe("batchAddProducts", () => {
    beforeEach(function () {
      batch = {
        type: 'Batch',
        products: [
          new Product("A200", "Product 6", 100, 10, 10.0),
          new Product("A201", "Product 7", 100, 10, 25.0),
        ],
      };
    });
    it("should add products for a normal request and return the correct no. added", () => {
      const result = cat.batchAddProducts(batch);
      expect(result).to.equal(2);
      let addedProduct = cat.findProductById("A200");
      expect(addedProduct).to.not.be.undefined;
      addedProduct = cat.findProductById("A201");
      expect(addedProduct).to.not.be.undefined;
    });

    it("should only add products with a non-zero quantity in stock", () => {
      batch.products.push(new Product("A202", "Product 8", 0, 10, 10.0));
      const result = cat.batchAddProducts(batch);
      expect(result).to.equal(2);
      const rejectedProduct = cat.findProductById("A202");
      expect(rejectedProduct).to.be.undefined;
    });
    it("should throw an exception when batch has a current product id", () => {
      batch.products.push(new Product("A123", "Product 9", 0, 10, 10.0));
      expect(() => cat.batchAddProducts(batch)).to.throw("Bad Batch");
      // Target state
      let rejectedProduct = cat.findProductById("A126");
      expect(rejectedProduct).to.be.undefined; 
    });
  });

  describe("Search",() => {
    beforeEach(function () {
      neededObj = {
        type: 'Search',
        products: [
          new Product("B123", "shoulder bag", 100, 10, 10.0),
          new Product("B124", "shoes", 100, 10, 25.0),
          new Product("B125", "shampoo",199, 20, 46.0)
        ],
      };
      cat.batchAddProducts(neededObj);
    });
    
    it("should return products cheaper than $ 25.01", () =>{
      const result = cat.speSearch({price: 25.0});
      expect(result.productIds).to.have.lengthOf(5);
      expect(result.productIds).to.have.members(["A123","A124","A125","B123","B124"]);
    });

    it("should returns the products with the keyword in their name", () =>{
     const result = cat.speSearch({ keyword: 'sho' });
     expect(result.productIds).to.have.lengthOf(2);
     expect(result.productIds).to.have.members(["B123","B124"]);
    });

    it("should throw bad batch when no such keyword in this object",()=>{
      expect(() => cat.speSearch({keyword:'Weight'}).to.throw("Bad Batch"));
    });

  });
});

