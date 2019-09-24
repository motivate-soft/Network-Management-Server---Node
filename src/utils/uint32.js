class UInt32Counter {
  constructor(initialValue) {
    this._val = initialValue ? UInt32Counter.toUInt32(initialValue) : 0;
  }

  get value() {
    return this._val;
  }

  set value(value) {
    this._val = UInt32Counter.toUInt32(value);
  }

  increment() {
    this._val = UInt32Counter.toUInt32(++this._val);
    return this.value;
  }

  decrement() {
    this._val = UInt32Counter.toUInt32(--this._val);
  }

  static toInt(value) {
    value = Number(value);
    return value < 0 ? Math.ceil(value) : Math.floor(value);
  }

  static modulo(a, b) {
    return a - Math.floor(a / b) * b;
  }

  static toUInt32(x) {
    return UInt32Counter.modulo(UInt32Counter.toInt(x), Math.pow(2, 32));
  }
}

module.exports.UInt32Counter = UInt32Counter;