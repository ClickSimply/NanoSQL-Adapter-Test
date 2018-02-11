Object.defineProperty(exports, "__esModule", { value: true });
var lie_ts_1 = require("lie-ts");
var utils_1 = require("./utils");
var utilities_1 = require("nano-sql/lib/utilities");
var TestAdapter = (function () {
    function TestAdapter(adapter, args) {
        var _this = this;
        this.adapter = adapter;
        this.args = args;
        new lie_ts_1.Promise(function (res, rej) {
            var adapter = new ((_a = _this.adapter).bind.apply(_a, [void 0].concat(_this.args)))();
            adapter.setID("123");
            var m = [{ key: "id", type: "int", props: ["pk", "ai"] }];
            adapter.makeTable("test", m);
            adapter.makeTable("test2", m);
            adapter.makeTable("test3", m);
            adapter.makeTable("test4", m);
            adapter.makeTable("test5", m);
            adapter.connect(function () {
                adapter.destroy(res);
            });
            var _a;
        }).then(function () {
            return _this.PrimaryKeys();
        }).then(function () {
            console.log("✓ Primary Key Tests Passed");
            return _this.Writes();
        }).then(function () {
            console.log("✓ Write Tests Passed");
            return _this.RangeReads();
        }).then(function () {
            console.log("✓ Range Read Tests Passed (number)");
            return _this.RangeReadsUUID();
        }).then(function () {
            console.log("✓ Range Read Tests Passed (uuid)");
            return _this.Deletes();
        }).then(function () {
            console.log("✓ Delete Tests Passed");
            console.log("✓ All Tests Passed!******");
            process.exit();
        }).catch(function (e) {
            console.error("Test Failed", e);
            process.exit();
        });
    }
    TestAdapter.prototype.Deletes = function () {
        var adapter = new ((_a = this.adapter).bind.apply(_a, [void 0].concat(this.args)))();
        var allRows = [];
        return new lie_ts_1.Promise(function (res, rej) {
            adapter.setID("123");
            adapter.makeTable("test", [
                { key: "id", type: "int", props: ["ai", "pk"] },
                { key: "name", type: "string" }
            ]);
            adapter.connect(res);
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                var titles = [];
                for (var i = 0; i < 100; i++) {
                    allRows.push({ id: i + 1, name: "Title " + (i + 1) });
                    titles.push("Title " + (i + 1));
                }
                utilities_1.fastCHAIN(titles, function (title, i, done) {
                    adapter.write("test", null, { name: title }, done, true);
                }).then(res);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.delete("test", 3, function () {
                    var rows = [];
                    adapter.rangeRead("test", function (row, idx, next) {
                        rows.push(row);
                        next();
                    }, function () {
                        var condition = utils_1.equals(rows, allRows.filter(function (r) { return r.id !== 3; }));
                        utils_1.myConsole.assert(condition, "Delete Test");
                        condition ? res() : rej(rows);
                    }, undefined, undefined);
                });
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.destroy(res);
            });
        });
        var _a;
    };
    TestAdapter.prototype.RangeReads = function () {
        var adapter = new ((_a = this.adapter).bind.apply(_a, [void 0].concat(this.args)))();
        var allRows = [];
        var index = [];
        return new lie_ts_1.Promise(function (res, rej) {
            adapter.setID("123");
            adapter.makeTable("test", [
                { key: "id", type: "int", props: ["ai", "pk"] },
                { key: "name", type: "string" }
            ]);
            adapter.connect(res);
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                var titles = [];
                for (var i = 0; i < 100; i++) {
                    allRows.push({ id: i + 1, name: "Title " + (i + 1) });
                    titles.push("Title " + (i + 1));
                    index.push(i + 1);
                }
                utilities_1.fastCHAIN(titles, function (title, i, done) {
                    adapter.write("test", null, { name: title }, done, true);
                }).then(res);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                var rows = [];
                if (adapter.batchRead) {
                    var ids_1 = [10, 11, 12, 20];
                    adapter.batchRead("test", ids_1, function (rows) {
                        var condition = utils_1.equals(rows.sort(function (a, b) { return a.id > b.id ? 1 : -1; }), allRows.filter(function (r) { return ids_1.indexOf(r.id) !== -1; }));
                        utils_1.myConsole.assert(condition, "Select Batch Rows");
                        condition ? res() : rej(rows);
                    });
                }
                else {
                    res();
                }
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                var rows = [];
                adapter.rangeRead("test", function (row, idx, next) {
                    rows.push(row);
                    next();
                }, function () {
                    var condition = utils_1.equals(rows, allRows.filter(function (r) { return r.id > 10 && r.id < 22; }));
                    utils_1.myConsole.assert(condition, "Select Range Test");
                    condition ? res() : rej(rows);
                }, 10, 20);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                var rows = [];
                adapter.rangeRead("test", function (row, idx, next) {
                    rows.push(row);
                    next();
                }, function () {
                    var condition = utils_1.equals(rows, allRows.filter(function (r) { return r.id > 9 && r.id < 21; }));
                    utils_1.myConsole.assert(condition, "Select Range Test (Primary Key)");
                    condition ? res() : rej({
                        g: rows,
                        e: allRows.filter(function (r) { return r.id > 9 && r.id < 21; })
                    });
                }, 10, 20, true);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                var rows = [];
                console.time("READ");
                adapter.rangeRead("test", function (row, idx, next) {
                    rows.push(row);
                    next();
                }, function () {
                    console.timeEnd("READ");
                    var condition = utils_1.equals(rows, allRows);
                    utils_1.myConsole.assert(condition, "Select Entire Table Test");
                    condition ? res() : rej({ e: allRows, g: rows });
                }, undefined, undefined);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.getIndex("test", false, function (idx) {
                    var condition = utils_1.equals(idx, index);
                    utils_1.myConsole.assert(condition, "Select Index Test");
                    condition ? res() : rej({
                        e: index,
                        g: idx
                    });
                });
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.getIndex("test", true, function (idx) {
                    var condition = idx === 100;
                    utils_1.myConsole.assert(condition, "Select Index Length Test");
                    condition ? res() : rej(idx);
                });
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.destroy(res);
            });
        });
        var _a;
    };
    TestAdapter.prototype.RangeReadsUUID = function () {
        var adapter = new ((_a = this.adapter).bind.apply(_a, [void 0].concat(this.args)))();
        var allRows = [];
        var index = [];
        return new lie_ts_1.Promise(function (res, rej) {
            adapter.setID("123");
            adapter.makeTable("test", [
                { key: "id", type: "uuid", props: ["ai", "pk"] },
                { key: "name", type: "string" }
            ]);
            adapter.connect(res);
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                var titles = [];
                for (var i = 0; i < 100; i++) {
                    var id = utilities_1.uuid();
                    allRows.push({ id: id, name: "Title " + (id) });
                    titles.push("Title " + (id));
                    index.push(id);
                }
                index.sort(function (a, b) { return a > b ? 1 : -1; });
                allRows.sort(function (a, b) { return a.id > b.id ? 1 : -1; });
                utilities_1.fastCHAIN(allRows, function (row, i, done) {
                    adapter.write("test", row.id, row, done, true);
                }).then(res);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                var rows = [];
                if (adapter.batchRead) {
                    var ids_2 = [];
                    for (var i = 0; i < 5; i++) {
                        ids_2.push(allRows[Math.floor(Math.random() * allRows.length)].id);
                    }
                    ids_2 = ids_2.filter(function (item, i, self) {
                        return self.indexOf(item) === i;
                    });
                    adapter.batchRead("test", ids_2, function (rows) {
                        var condition = utils_1.equals(rows, allRows.filter(function (r) { return ids_2.indexOf(r.id) !== -1; }));
                        utils_1.myConsole.assert(condition, "Select Batch Rows");
                        condition ? res() : rej({
                            e: allRows.filter(function (r) { return ids_2.indexOf(r.id) !== -1; }),
                            g: rows
                        });
                    });
                }
                else {
                    res();
                }
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                var rows = [];
                adapter.rangeRead("test", function (row, idx, next) {
                    rows.push(row);
                    next();
                }, function () {
                    var condition = utils_1.equals(rows, allRows.filter(function (r, i) { return i > 9 && i < 21; }));
                    utils_1.myConsole.assert(condition, "Select Range Test");
                    condition ? res() : rej({ g: rows, e: allRows.filter(function (r, i) { return i > 9 && i < 21; }) });
                }, 10, 20);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                var rows = [];
                adapter.rangeRead("test", function (row, idx, next) {
                    rows.push(row);
                    next();
                }, function () {
                    var condition = utils_1.equals(rows, allRows.filter(function (r) { return r.id >= allRows[10].id && r.id <= allRows[20].id; }));
                    utils_1.myConsole.assert(condition, "Select Range Test (Primary Key)");
                    condition ? res() : rej({
                        g: rows,
                        e: allRows.filter(function (r) { return r.id >= allRows[10].id && r.id <= allRows[20].id; })
                    });
                }, allRows[10].id, allRows[20].id, true);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                var rows = [];
                console.time("READ");
                adapter.rangeRead("test", function (row, idx, next) {
                    rows.push(row);
                    next();
                }, function () {
                    console.timeEnd("READ");
                    var condition = utils_1.equals(rows, allRows);
                    utils_1.myConsole.assert(condition, "Select Entire Table Test");
                    condition ? res() : rej(rows);
                }, undefined, undefined);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.getIndex("test", false, function (idx) {
                    var condition = utils_1.equals(idx, index);
                    utils_1.myConsole.assert(condition, "Select Index Test");
                    condition ? res() : rej({
                        e: index,
                        g: idx
                    });
                });
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.getIndex("test", true, function (idx) {
                    var condition = idx === 100;
                    utils_1.myConsole.assert(condition, "Select Index Length Test");
                    condition ? res() : rej(idx);
                });
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.destroy(res);
            });
        });
        var _a;
    };
    TestAdapter.prototype.Writes = function () {
        var adapter = new ((_a = this.adapter).bind.apply(_a, [void 0].concat(this.args)))();
        return new lie_ts_1.Promise(function (res, rej) {
            adapter.setID("123");
            adapter.makeTable("test", [
                { key: "id", type: "int", props: ["ai", "pk"] },
                { key: "name", type: "string" },
                { key: "posts", type: "string[]" }
            ]);
            adapter.connect(res);
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.write("test", null, { name: "Test", posts: [1, 2] }, function (row) {
                    adapter.read("test", row.id, function (row) {
                        var condition = utils_1.equals(row, { name: "Test", id: 1, posts: [1, 2] });
                        utils_1.myConsole.assert(condition, "Insert Test");
                        condition ? res() : rej(row);
                    });
                }, true);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.write("test", 1, { name: "Testing" }, function (row) {
                    adapter.read("test", row.id, function (row) {
                        var condition = utils_1.equals(row, { name: "Testing", id: 1, posts: [1, 2] });
                        utils_1.myConsole.assert(condition, "Update Test");
                        condition ? res() : rej(row);
                    });
                }, false);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.write("test", 1, { name: "Testing" }, function (row) {
                    adapter.read("test", row.id, function (row) {
                        var condition = utils_1.equals(row, { name: "Testing", id: 1 });
                        utils_1.myConsole.assert(condition, "Replace Test");
                        condition ? res() : rej(row);
                    });
                }, true);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.destroy(res);
            });
        });
        var _a;
    };
    TestAdapter.prototype.PrimaryKeys = function () {
        var adapter = new ((_a = this.adapter).bind.apply(_a, [void 0].concat(this.args)))();
        return new lie_ts_1.Promise(function (res, rej) {
            adapter.setID("123");
            adapter.makeTable("test", [
                { key: "id", type: "int", props: ["ai", "pk"] },
                { key: "name", type: "string" }
            ]);
            adapter.makeTable("test2", [
                { key: "id", type: "uuid", props: ["pk"] },
                { key: "name", type: "string" }
            ]);
            adapter.makeTable("test3", [
                { key: "id", type: "timeId", props: ["pk"] },
                { key: "name", type: "string" }
            ]);
            adapter.makeTable("test4", [
                { key: "id", type: "timeIdms", props: ["pk"] },
                { key: "name", type: "string" }
            ]);
            adapter.makeTable("test5", [
                { key: "id", type: "uuid", props: ["pk"] },
                { key: "name", type: "string" }
            ]);
            adapter.connect(res);
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.write("test", null, { name: "Test" }, function (row) {
                    var condition = utils_1.equals(row, { name: "Test", id: 1 });
                    utils_1.myConsole.assert(condition, "Test Auto Incriment Integer.");
                    condition ? res() : rej(row);
                }, true);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.write("test2", null, { name: "Test" }, function (row) {
                    var condition = row.id.match(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/);
                    utils_1.myConsole.assert(condition, "Test UUID.");
                    condition ? res() : rej(row.id);
                }, true);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.write("test3", null, { name: "Test" }, function (row) {
                    var condition = row.id.match(/^\w{10}-\w{1,5}$/);
                    utils_1.myConsole.assert(condition, "Test timeId.");
                    condition ? res() : rej(row.id);
                }, true);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.write("test4", null, { name: "Test" }, function (row) {
                    var condition = row.id.match(/^\w{13}-\w{1,5}$/);
                    utils_1.myConsole.assert(condition, "Test timeIdms.");
                    condition ? res() : rej(row.id);
                }, true);
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                var UUIDs = [];
                for (var i = 0; i < 20; i++) {
                    UUIDs.push(utilities_1.uuid());
                }
                utilities_1.fastCHAIN(UUIDs, function (uuid, i, done) {
                    adapter.write("test5", uuid, { name: "Test" }, done, true);
                }).then(function () {
                    UUIDs.sort();
                    var keys = [];
                    adapter.rangeRead("test5", function (row, idx, next) {
                        keys.push(row.id);
                        next();
                    }, function () {
                        var condition = utils_1.equals(keys, UUIDs);
                        utils_1.myConsole.assert(condition, "Test Sorted Primary Keys.");
                        condition ? res() : rej({ e: UUIDs, g: keys });
                    }, undefined, undefined);
                });
            });
        }).then(function () {
            return new lie_ts_1.Promise(function (res, rej) {
                adapter.destroy(res);
            });
        });
        var _a;
    };
    return TestAdapter;
}());
exports.TestAdapter = TestAdapter;
