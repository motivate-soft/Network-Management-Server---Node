const { ApiErrorField, ValidationCode } = require("./errors");
const { isString, isNumberType } = require("../utils/helpers");

class ModelSchema {
  constructor(schemaMap = {}) {
    this.schemaMap = schemaMap;
  }

  static string() {
    return new StringSchema();
  }

  static number() {
    return new NumberSchema();
  }

  static validate(model, modelSchema) {
    let errors = [];
    for (let key in modelSchema.schemaMap) {
      if (typeof modelSchema.schemaMap[key].validate === 'function') {
        errors = errors.concat(modelSchema.schemaMap[key].validate(key, model));
      } else if (modelSchema.schemaMap[key] instanceof Object) {
        /* supporting for nested validation
            e.g. validates for meta.secondEmail
            new ModelSchema({
              email: ModelSchema.string().required().email().max(128),
              meta: {
                secondEmail: ModelSchema.string().required().email().max(128),
                mobile: ModelSchema.string().max(10)
              }
            })
        */
        let nestedSchema = new ModelSchema(modelSchema.schemaMap[key]);
        let nesetdValidation = ModelSchema.validate(model[key], nestedSchema);
        if (nesetdValidation.errors !== null) {
          errors = errors.concat(nesetdValidation.errors);
        }
      }
    }

    return {
      errors: errors.length > 0 ? errors : null,
      model: model
    };
  }

  static resolve(path, obj, separator = ".") {
    let properties = Array.isArray(path) ? path : path.split(separator);
    return properties.reduce((prev, curr) => prev && prev[curr], obj);
  }
}

class AnySchema {
  constructor() {
    this._required = false;
  }

  required() {
    this._required = true;
    return this.clone();
  }

  clone() {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }

  // eslint-disable-next-line no-unused-vars
  validate(field, value, model = null) {
    let errors = [];

    if (this._required && (value === undefined || value === null || (value + "") === "")) {
      errors.push(new ApiErrorField(field, "Field is required.", ValidationCode.REQUIRED));
    }

    return errors;
  }
}

class NumberSchema extends AnySchema {
  constructor() {
    super();
    this._min = null;
    this._max = null;
  }

  min(limit) {
    this._min = limit;
    return this.clone();
  }

  max(limit) {
    this._max = limit;
    return this.clone();
  }

  validate(field, model) {
    let value = ModelSchema.resolve(field, model);
    let errors = super.validate(field, value, model);
    if (errors.length > 0) {
      return errors;
    }

    // Skip all validation if value is null or undefined, which will be caught in super if required() is used.
    if (value === null || value === undefined) {
      return errors;
    }

    if (!isNumberType(value)) {
      errors.push(new ApiErrorField(field, "Value is not a number.", ValidationCode.INVALID_TYPE));
      return errors;
    }

    if (this._min !== null && value < this._min) {
      errors.push(new ApiErrorField(field, `Value must be greater than ${this._min - 1}.`, ValidationCode.MIN_RANGE));
    }

    if (this._max !== null && value > this._max) {
      errors.push(new ApiErrorField(field, `Value must be less than ${this._max + 1}.`, ValidationCode.MAX_RANGE));
    }

    return errors;
  }
}

class StringSchema extends AnySchema {
  constructor() {
    super();
    this._min = null;
    this._max = null;
    this._compareField = null;
    this._emailRegex = null;
    this._enum = null;
  }

  min(limit) {
    this._min = limit;
    return this.clone();
  }

  max(limit) {
    this._max = limit;
    return this.clone();
  }

  compare(compareField) {
    this._compareField = compareField;
    return this.clone();
  }

  email() {
    this._emailRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return this.clone();
  }

  enum(enumList) {
    this._enum = enumList;
    return this.clone();
  }

  validate(field, model) {
    let value = ModelSchema.resolve(field, model);
    let errors = super.validate(field, value, model);
    if (errors.length > 0) {
      return errors;
    }

    // Skip all validation if value is null or undefined, which will be caught in super if required() is used.
    if (value === null || value === undefined) {
      return errors;
    }

    if (!isString(value)) {
      errors.push(new ApiErrorField(field, "Value is not a string.", ValidationCode.INVALID_TYPE));
      return errors;
    }

    if (this._min !== null && value.length < this._min) {
      errors.push(new ApiErrorField(field, `Minimum ${this._min} characters required.`, ValidationCode.MIN_LENGTH));
    }

    if (this._max !== null && value.length > this._max) {
      errors.push(new ApiErrorField(field, `Maximum ${this._max} characters exceeded.`, ValidationCode.MAX_LENGTH));
    }

    if (this._compareField !== null && value !== ModelSchema.resolve(this._compareField, model)) {
      errors.push(new ApiErrorField(field, `Value does not match ${this._compareField}.`, ValidationCode.COMPARE));
    }

    if (this._emailRegex !== null && !this._emailRegex.test(value)) {
      errors.push(new ApiErrorField(field, "Not a valid email address.", ValidationCode.EMAIL));
    }

    if (this._enum !== null && !this._enum.includes(value)) {
      errors.push(new ApiErrorField(field, `Value should be one of: ${this._enum.join(", ")}`, ValidationCode.ENUM));
    }

    return errors;
  }
}

module.exports = {
  ModelSchema,
  NumberSchema,
  StringSchema
};