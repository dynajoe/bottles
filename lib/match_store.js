var MatchStore = module.exports = function () {
	this._store = {};
};

MatchStore.prototype.add = function (key, match) {
	this._store[key] = match;
};

MatchStore.prototype.find = function (criteria) {
	this._store = 	
};