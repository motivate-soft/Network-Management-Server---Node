const { ModelSchema, NumberSchema, StringSchema } = require("../src/services/validation");
const { ValidationCode } = require("../src/services/errors");

describe("ModelSchema", () => {

  describe("create schemas", () => {
    test("create NumberSchema", () => {
      let schema = ModelSchema.number();
      expect(schema).toBeInstanceOf(NumberSchema);
    });

    test("create StringSchema", () => {
      let schema = ModelSchema.string();
      expect(schema).toBeInstanceOf(StringSchema);
    });

    test("schemaMap should use correct schemas", () => {
      let schema = new ModelSchema({
        numberProp: ModelSchema.number(),
        stringProp: ModelSchema.string()
      });
      expect(schema.schemaMap.numberProp).toBeInstanceOf(NumberSchema);
      expect(schema.schemaMap.stringProp).toBeInstanceOf(StringSchema);
    });

    test("add to schemaMap", () => {
      let schema = new ModelSchema({
        numberProp: ModelSchema.number(),
        stringProp: ModelSchema.string()
      });
      schema.schemaMap["newNumberProp"] = ModelSchema.number();
      schema.schemaMap["newStringProp"] = ModelSchema.string().min(5);
      expect(schema.schemaMap.numberProp).toBeInstanceOf(NumberSchema);
      expect(schema.schemaMap.stringProp).toBeInstanceOf(StringSchema);
      expect(schema.schemaMap.newNumberProp).toBeInstanceOf(NumberSchema);
      expect(schema.schemaMap.newStringProp).toBeInstanceOf(StringSchema);

      let result = ModelSchema.validate({ newStringProp: "abcd" }, schema);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ field: "newStringProp", code: ValidationCode.MIN_LENGTH });
    });
  });

  describe("return object", () => {
    let schema = new ModelSchema({
      numberProp: ModelSchema.number(),
      stringProp: ModelSchema.string()
    });

    test("should return object with errors and model properties", () => {
      let result = ModelSchema.validate({ a: 1, b: "123" }, schema);
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("model");
    });

    test("should return object with model property that matches model", () => {
      let result = ModelSchema.validate({ a: 1, b: "123" }, schema);
      expect(result.model).toEqual({ a: 1, b: "123" });
    });
  });

  describe("model validation", () => {
    test("should return error on invalid number validation", () => {
      let schema = new ModelSchema({
        prop: ModelSchema.number().min(100)
      });
      let result = ModelSchema.validate({ prop: 10 }, schema);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ field: "prop", code: ValidationCode.MIN_RANGE });
    });

    test("should return null errors property on valid number validation", () => {
      let schema = new ModelSchema({
        prop: ModelSchema.number().min(100)
      });
      let result = ModelSchema.validate({ prop: 100 }, schema);
      expect(result.errors).toBeNull();
    });

    test("should return error on invalid string validation", () => {
      let schema = new ModelSchema({
        prop: ModelSchema.string().min(5)
      });
      let result = ModelSchema.validate({ prop: "abcd" }, schema);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ field: "prop", code: ValidationCode.MIN_LENGTH });
    });

    test("should return null errors property on valid string validation", () => {
      let schema = new ModelSchema({
        prop: ModelSchema.string().min(5)
      });
      let result = ModelSchema.validate({ prop: "abcde" }, schema);
      expect(result.errors).toBeNull();
    });

    test("should return 2 errors on both invalid number and string validations", () => {
      let schema = new ModelSchema({
        numberProp: ModelSchema.number().max(100),
        stringProp: ModelSchema.string().email()
      });
      let result = ModelSchema.validate({ numberProp: 150, stringProp: "test@test"}, schema);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toMatchObject({field: "numberProp", code: ValidationCode.MAX_RANGE});
      expect(result.errors[1]).toMatchObject({field: "stringProp", code: ValidationCode.EMAIL});
    });
  });

  describe("nested model validation", () => {
    test("should work on first level nested properties", () => {
      let schema = new ModelSchema({
        "nested.prop": ModelSchema.number().min(100),
      });
      let result = ModelSchema.validate({ nested: { prop: 10 } }, schema);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ field: "nested.prop", code: ValidationCode.MIN_RANGE });
    });

    test("should work on first level nested properties with valid value", () => {
      let schema = new ModelSchema({
        "nested.prop": ModelSchema.number().min(100),
      });
      let result = ModelSchema.validate({ nested: { prop: 100 } }, schema);
      expect(result.errors).toBeNull();
    });

    test("should work on second level nested properties", () => {
      let schema = new ModelSchema({
        "nested.prop.child": ModelSchema.number().min(100),
      });
      let result = ModelSchema.validate({ nested: { prop: { child: 10 } } }, schema);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ field: "nested.prop.child", code: ValidationCode.MIN_RANGE });
    });

    test("should work on second level nested properties with valid value", () => {
      let schema = new ModelSchema({
        "nested.prop.child": ModelSchema.number().min(100),
      });
      let result = ModelSchema.validate({ nested: { prop: { child: 100 } } }, schema);
      expect(result.errors).toBeNull();
    });
  });

});

describe("NumberSchema", () => {

  describe("min validation", () => {
    let schema = ModelSchema.number().min(100);

    test("should accept value greater than min", () => {
      let result = schema.validate("prop", { prop: 150 });
      expect(result).toHaveLength(0);
    });

    test("should give error on value less than min", () => {
      let result = schema.validate("prop", { prop: 50 });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.MIN_RANGE }]);
    });

    test("should accept when value is null", () => {
      let result = schema.validate("prop", { prop: null });
      expect(result).toHaveLength(0);
    });

    test("should accept when value is undefined", () => {
      let result = schema.validate("prop", {});
      expect(result).toHaveLength(0);
    });

    test("should accept when value equals min", () => {
      let result = schema.validate("prop", { prop: 100 });
      expect(result).toHaveLength(0);
    });
  });

  describe("max validation", () => {
    let schema = ModelSchema.number().max(100);

    test("should accept value less than max", () => {
      let result = schema.validate("prop", { prop: 50 });
      expect(result).toHaveLength(0);
    });

    test("should give error on value greater than max", () => {
      let result = schema.validate("prop", { prop: 150 });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.MAX_RANGE }]);
    });

    test("should accept null value", () => {
      let result = schema.validate("prop", { prop: null });
      expect(result).toHaveLength(0);
    });

    test("should accept undefined value", () => {
      let result = schema.validate("prop", {});
      expect(result).toHaveLength(0);
    });

    test("should accept value that equals max", () => {
      let result = schema.validate("prop", { prop: 100 });
      expect(result).toHaveLength(0);
    });
  });

  describe("type validation", () => {
    let schema = ModelSchema.number();

    test("should accept integer number", () => {
      let result = schema.validate("prop", { prop: 50 });
      expect(result).toHaveLength(0);
    });

    test("should accept float number", () => {
      let result = schema.validate("prop", { prop: 50.5 });
      expect(result).toHaveLength(0);
    });

    test("should give error when value is not a number", () => {
      let result = schema.validate("prop", { prop: "abc" });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.INVALID_TYPE }]);
    });

    test("should give error when value is a string representing a number", () => {
      let result = schema.validate("prop", { prop: "50" });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.INVALID_TYPE }]);
    });
  });

  describe("required validation", () => {
    let schema = ModelSchema.number().required();

    test("should accept when value is present", () => {
      let result = schema.validate("prop", { prop: 50 });
      expect(result).toHaveLength(0);
    });

    test("should accept when value is 0", () => {
      let result = schema.validate("prop", { prop: 0 });
      expect(result).toHaveLength(0);
    });

    test("should give error when value is null", () => {
      let result = schema.validate("prop", { prop: null });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.REQUIRED }]);
    });

    test("should give error when value is undefined", () => {
      let result = schema.validate("prop", {});
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.REQUIRED }]);
    });
  });

});

describe("StringSchema", () => {

  describe("min validation", () => {
    let schema = ModelSchema.string().min(5);

    test("should accept value with length greater than min", () => {
      let result = schema.validate("prop", { prop: "1234567890" });
      expect(result).toHaveLength(0);
    });

    test("should accept value with length equal to min", () => {
      let result = schema.validate("prop", { prop: "12345" });
      expect(result).toHaveLength(0);
    });

    test("should give error on value with length less than min", () => {
      let result = schema.validate("prop", { prop: "1234" });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.MIN_LENGTH }]);
    });

    test("should accept when value is null", () => {
      let result = schema.validate("prop", { prop: null });
      expect(result).toHaveLength(0);
    });

    test("should accept when value is undefined", () => {
      let result = schema.validate("prop", {});
      expect(result).toHaveLength(0);
    });
  });

  describe("max validation", () => {
    let schema = ModelSchema.string().max(10);

    test("should accept value with length less than max", () => {
      let result = schema.validate("prop", { prop: "123456789" });
      expect(result).toHaveLength(0);
    });

    test("should give error on value with length greater than max", () => {
      let result = schema.validate("prop", { prop: "12345678901" });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.MAX_LENGTH }]);
    });

    test("should accept null value", () => {
      let result = schema.validate("prop", { prop: null });
      expect(result).toHaveLength(0);
    });

    test("should accept undefined value", () => {
      let result = schema.validate("prop", {});
      expect(result).toHaveLength(0);
    });

    test("should accept value with length that equals max", () => {
      let result = schema.validate("prop", { prop: "1234567890" });
      expect(result).toHaveLength(0);
    });
  });

  describe("compare validation", () => {
    let schema = ModelSchema.string().compare("compareProp");

    test("should accept when value equals compare property", () => {
      let result = schema.validate("prop", { prop: "abc", compareProp: "abc" });
      expect(result).toHaveLength(0);
    });

    test("should give error when value does not equal compare property", () => {
      let result = schema.validate("prop", { prop: "abc", compareProp: "xyz" });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.COMPARE }]);
    });

    test("should accept when value and compare property are both null", () => {
      let result = schema.validate("prop", { prop: null, compareProp: null });
      expect(result).toHaveLength(0);
    });

    test("should give error when value exists but compare property is null", () => {
      let result = schema.validate("prop", { prop: "abc", compareProp: null });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.COMPARE }]);
    });

    test("should give error when value exists but compare property is undefined", () => {
      let result = schema.validate("prop", { prop: "abc" });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.COMPARE }]);
    });

    test("should give error when value is substring of compare property", () => {
      let result = schema.validate("prop", { prop: "abc", compareProp: "abcd" });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.COMPARE }]);
    });

    test("should give error when compare property is substring of value", () => {
      let result = schema.validate("prop", { prop: "abc", compareProp: "ab" });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.COMPARE }]);
    });
  });

  describe("email validation", () => {
    let schema = ModelSchema.string().email();

    test("should accept when value is an email address", () => {
      let result = schema.validate("prop", { prop: "test@test.com" });
      expect(result).toHaveLength(0);
    });

    test("should give error when value is not an email address", () => {
      let result = schema.validate("prop", { prop: "abc" });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.EMAIL }]);
    });

    test("should accept when value is null", () => {
      let result = schema.validate("prop", { prop: null });
      expect(result).toHaveLength(0);
    });

    test("should accept when value is undefined", () => {
      let result = schema.validate("prop", {});
      expect(result).toHaveLength(0);
    });
  });

  describe("enum validation", () => {
    let schema = ModelSchema.string().enum(["yes", "no"]);

    test("should accept when value is a valid option", () => {
      let result = schema.validate("prop", { prop: "yes" });
      expect(result).toHaveLength(0);
    });

    test("should give error when value is not a valid option", () => {
      let result = schema.validate("prop", { prop: "maybe" });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.ENUM }]);
      result = schema.validate("prop", { prop: "yesno" });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.ENUM }]);
    });

    test("should accept when value is null", () => {
      let result = schema.validate("prop", { prop: null });
      expect(result).toHaveLength(0);
    });

    test("should accept when value is undefined", () => {
      let result = schema.validate("prop", {});
      expect(result).toHaveLength(0);
    });
  });

  describe("type validation", () => {
    let schema = ModelSchema.string();

    test("should accept string", () => {
      let result = schema.validate("prop", { prop: "abc" });
      expect(result).toHaveLength(0);
    });

    test("should give error when value is not a string", () => {
      let result = schema.validate("prop", { prop: 100 });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.INVALID_TYPE }]);
    });
  });

  describe("required validation", () => {
    let schema = ModelSchema.string().required();

    test("should accept when value is present", () => {
      let result = schema.validate("prop", { prop: "abc" });
      expect(result).toHaveLength(0);
    });

    test("should give error when value is an empty string", () => {
      let result = schema.validate("prop", { prop: "" });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.REQUIRED }]);
    });

    test("should give error when value is null", () => {
      let result = schema.validate("prop", { prop: null });
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.REQUIRED }]);
    });

    test("should give error when value is undefined", () => {
      let result = schema.validate("prop", {});
      expect(result).toHaveLength(1);
      expect(result).toMatchObject([{ code: ValidationCode.REQUIRED }]);
    });
  });

});