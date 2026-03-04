export default class Bank {
  constructor(startingGold = 0) {
    this._balance = startingGold;
  }

  get balance() { return this._balance; }

  deposit(amount) {
    if (amount > 0) this._balance += amount;
  }

  withdraw(amount) {
    if (this._balance < amount) return false;
    this._balance -= amount;
    return true;
  }

  canAfford(amount) {
    return this._balance >= amount;
  }
}
