/**
 * Most adapters can only run exclusively in the browser or NodeJS.
 * This adapter test class is meant to handle both situations.
 *
 *
 * TO TEST YOUR ADAPTER
 * 1. Replace the _SyncStore import at the top with your own adapter.
 * 2. Set your adapter and argumnets to pass into it at the bottom.
 *
 * NODEJS:
 * 3. ts-node --disableWarnings test.ts
 *
 * BROWSER:
 * 3. npm run test-browser then navigate to localhost::8080. Test results will be in the console.
 *
 */

import { NanoSQLStorageAdapter } from "nano-sql/lib/database/storage";
import { Promise } from "lie-ts";
import { myConsole, equals } from "./utils";
import { fastCHAIN, uuid } from "nano-sql/lib/utilities";

export class TestAdapter {

    constructor(
        public adapter: any,
        public args: any[]
    ) {
        new Promise((res, rej) => {
            const adapter: NanoSQLStorageAdapter = new this.adapter(...this.args);
            adapter.setID("123");
            const m = [{key: "id", type: "int", props: ["pk", "ai"]}];
            adapter.makeTable("test", m);
            adapter.makeTable("test2", m);
            adapter.makeTable("test3", m);
            adapter.makeTable("test4", m);
            adapter.makeTable("test5", m);
            adapter.connect(() => {
                adapter.destroy(res);
            });
        }).then(() => {        
            return this.PrimaryKeys();
        }).then(() => {
            console.log("✓ Primary Key Tests Passed");
            return this.Writes();
        }).then(() => {
            console.log("✓ Write Tests Passed");
            return this.RangeReads();
        }).then(() => {
            console.log("✓ Range Read Tests Passed (number)");
            return this.RangeReadsUUID();
        }).then(() => {
            console.log("✓ Range Read Tests Passed (uuid)");
            return this.Deletes();
        }).then(() => {
            console.log("✓ Delete Tests Passed");
            console.log("✓ All Tests Passed!******");
        }).catch((e) => {
            console.error("Test Failed", e);
        });
    }

    public Deletes() {
        const adapter: NanoSQLStorageAdapter = new this.adapter(...this.args);

        let allRows: any[] = [];
        return new Promise((res, rej) => {
            adapter.setID("123");
            adapter.makeTable("test", [
                { key: "id", type: "int", props: ["ai", "pk"] },
                { key: "name", type: "string" }
            ]);
            adapter.connect(res);
        }).then(() => {
            return new Promise((res, rej) => {
                let titles: any[] = [];
                for (let i = 0; i < 100; i++) {
                    allRows.push({id: i + 1, name: "Title " + (i + 1)});
                    titles.push("Title " + (i + 1));
                }
                fastCHAIN(titles, (title, i, done) => {
                    adapter.write("test", null, {name: title}, done);
                }).then(res);
            });
        }).then(() => {
            return new Promise((res, rej) => {
                // single rows can be deleted.
                adapter.delete("test", 3 as any, () => {
                    let rows: any[] = [];
                    adapter.rangeRead("test", (row, idx, next) => {
                        rows.push(row);
                        next();
                    }, () => {
                        const condition = equals(rows, allRows.filter(r => r.id !== 3));
                        myConsole.assert(condition, "Delete Test");
                        condition ? res() : rej(rows);
                    }, undefined, undefined);
                });
            });
        }).then(() => {
            return new Promise((res, rej) => {
                adapter.destroy(res);
            });
        });
    }

    public RangeReads() {
        const adapter: NanoSQLStorageAdapter = new this.adapter(...this.args);

        let allRows: any[] = [];
        let index: any[] = [];
        return new Promise((res, rej) => {
            adapter.setID("123");
            adapter.makeTable("test", [
                { key: "id", type: "int", props: ["ai", "pk"] },
                { key: "name", type: "string" }
            ]);
            adapter.connect(res);
        }).then(() => {
            return new Promise((res, rej) => {

                let titles: any[] = [];
                for (let i = 0; i < 100; i++) {
                    allRows.push({id: i + 1, name: "Title " + (i + 1)});
                    titles.push("Title " + (i + 1));
                    index.push(i + 1);
                }
                fastCHAIN(titles, (title, i, done) => {
                    adapter.write("test", null, {name: title}, done);
                }).then(res);
            });
        }).then(() => {
            // Select using batchRead
            return new Promise((res, rej) => {
                let rows: any[] = [];
                if (adapter.batchRead) {
                    const ids: any[] = [10, 11, 12, 20];
                    adapter.batchRead("test", ids, (rows) => {
                        const condition = equals(rows.sort((a, b) => a.id > b.id ? 1 : -1), allRows.filter(r => ids.indexOf(r.id) !== -1));
                        myConsole.assert(condition, "Select Batch Rows");
                        condition ? res() : rej(rows);
                    });
                } else {
                    res();
                }
            });
        }).then(() => {   
            // Select a range of rows using a range of the index
            return new Promise((res, rej) => {
                let rows: any[] = [];
                adapter.rangeRead("test", (row, idx, next) => {
                    rows.push(row);
                    next();
                }, () => {
                    const condition = equals(rows, allRows.filter(r => r.id > 10 && r.id < 22));
                    myConsole.assert(condition, "Select Range Test");
                    condition ? res() : rej(rows);
                }, 10, 20);
            });
        }).then(() => {
            // Select a range of rows given a lower and upper limit primary key
            return new Promise((res, rej) => {
                let rows: any[] = [];
                adapter.rangeRead("test", (row, idx, next) => {
                    rows.push(row);
                    next();
                }, () => {
                    const condition = equals(rows, allRows.filter(r => r.id > 9 && r.id < 21));
                    myConsole.assert(condition, "Select Range Test (Primary Key)");
                    condition ? res() : rej({
                        g: rows,
                        e: allRows.filter(r => r.id > 9 && r.id < 21)
                    });
                }, 10, 20, true);
            });
        }).then(() => {
            // Select entire table
            return new Promise((res, rej) => {
                let rows: any[] = [];
                console.time("READ");
                adapter.rangeRead("test", (row, idx, next) => {
                    rows.push(row);
                    next();
                }, () => {
                    console.timeEnd("READ");
                    const condition = equals(rows, allRows);
                    myConsole.assert(condition, "Select Entire Table Test");
                    condition ? res() : rej({e: allRows, g: rows});
                }, undefined, undefined);
            });
        }).then(() => {
            // Select index
            return new Promise((res, rej) => {
                adapter.getIndex("test", false, (idx) => {
                    const condition = equals(idx, index);
                    myConsole.assert(condition, "Select Index Test");
                    condition ? res() : rej({
                        e: index,
                        g: idx
                    });
                });
            });
        }).then(() => {
            // Select index length
            return new Promise((res, rej) => {
                adapter.getIndex("test", true, (idx) => {
                    const condition = idx === 100;
                    myConsole.assert(condition, "Select Index Length Test");
                    condition ? res() : rej(idx);
                });
            });
        }).then(() => {
            return new Promise((res, rej) => {
                adapter.destroy(res);
            });
        });
    }

    public RangeReadsUUID() {
        const adapter: NanoSQLStorageAdapter = new this.adapter(...this.args);

        let allRows: any[] = [];
        let index: any[] = [];
        return new Promise((res, rej) => {
            adapter.setID("123");
            adapter.makeTable("test", [
                { key: "id", type: "uuid", props: ["ai", "pk"] },
                { key: "name", type: "string" }
            ]);
            adapter.connect(res);
        }).then(() => {
            return new Promise((res, rej) => {

                let titles: any[] = [];
                for (let i = 0; i < 100; i++) {
                    const id = uuid();
                    allRows.push({id: id, name: "Title " + (id)});
                    titles.push("Title " + (id));
                    index.push(id);
                }
                index.sort((a, b) => a > b ? 1 : -1);
                allRows.sort((a, b) => a.id > b.id ? 1 : -1);
                fastCHAIN(allRows, (row, i, done) => {
                    adapter.write("test", row.id, row, done);
                }).then(res);
            });
        }).then(() => {
            // Select using batchRead
            return new Promise((res, rej) => {
                let rows: any[] = [];
                if (adapter.batchRead) {
                    let ids: any[] = [];
                    for (let i = 0; i < 5; i++) {
                        ids.push(allRows[Math.floor(Math.random() * allRows.length)].id);
                    }
                    ids = ids.filter((item, i, self) => {
                        return self.indexOf(item) === i;
                    });
                    adapter.batchRead("test", ids, (rows) => {
                        const condition = equals(rows, allRows.filter(r => ids.indexOf(r.id) !== -1));
                        myConsole.assert(condition, "Select Batch Rows");
                        condition ? res() : rej({
                            e: allRows.filter(r => ids.indexOf(r.id) !== -1),
                            g: rows
                        });
                    });
                } else {
                    res();
                }
            });
        }).then(() => {   
            // Select a range of rows using a range of the index
            return new Promise((res, rej) => {
                let rows: any[] = [];
                adapter.rangeRead("test", (row, idx, next) => {
                    rows.push(row);
                    next();
                }, () => {
                    const condition = equals(rows, allRows.filter((r, i) => i > 9 && i < 21));
                    myConsole.assert(condition, "Select Range Test");
                    condition ? res() : rej({g: rows, e: allRows.filter((r, i) => i > 9 && i < 21)});
                }, 10, 20);
            });
        }).then(() => {
            // Select a range of rows given a lower and upper limit primary key
            return new Promise((res, rej) => {
                let rows: any[] = [];
                adapter.rangeRead("test", (row, idx, next) => {
                    rows.push(row);
                    next();
                }, () => {
                    const condition = equals(rows, allRows.filter(r => r.id >= allRows[10].id && r.id <= allRows[20].id));
                    myConsole.assert(condition, "Select Range Test (Primary Key)");
                    condition ? res() : rej({
                        g: rows,
                        e: allRows.filter(r => r.id >= allRows[10].id && r.id <= allRows[20].id)
                    });
                }, allRows[10].id, allRows[20].id, true);
            });
        }).then(() => {
            // Select entire table
            return new Promise((res, rej) => {
                let rows: any[] = [];
                console.time("READ");
                adapter.rangeRead("test", (row, idx, next) => {
                    rows.push(row);
                    next();
                }, () => {
                    console.timeEnd("READ");
                    const condition = equals(rows, allRows);
                    myConsole.assert(condition, "Select Entire Table Test");
                    condition ? res() : rej(rows);
                }, undefined, undefined);
            });
        }).then(() => {
            // Select index
            return new Promise((res, rej) => {
                adapter.getIndex("test", false, (idx) => {
                    const condition = equals(idx, index);
                    myConsole.assert(condition, "Select Index Test");
                    condition ? res() : rej({
                        e: index,
                        g: idx
                    });
                });
            });
        }).then(() => {
            // Select index length
            return new Promise((res, rej) => {
                adapter.getIndex("test", true, (idx) => {
                    const condition = idx === 100;
                    myConsole.assert(condition, "Select Index Length Test");
                    condition ? res() : rej(idx);
                });
            });
        }).then(() => {
            return new Promise((res, rej) => {
                adapter.destroy(res);
            });
        });
    }

    public Writes() {
        const adapter: NanoSQLStorageAdapter = new this.adapter(...this.args);
        return new Promise((res, rej) => {
            adapter.setID("123");
            adapter.makeTable("test", [
                { key: "id", type: "int", props: ["ai", "pk"] },
                { key: "name", type: "string" },
                { key: "posts", type: "string[]"}
            ]);
            adapter.connect(res);
        }).then(() => {
            // make sure new rows are added correctly
            return new Promise((res, rej) => {
                adapter.write("test", null, { name: "Test", posts: [1, 2] }, (row) => {
                    adapter.read("test", row.id, (row) => {
                        const condition = equals(row, {name: "Test", id: 1, posts: [1, 2]});
                        myConsole.assert(condition, "Insert Test");
                        condition ? res() : rej(row);
                    });
                });
            });
        }).then(() => {
            // Make sure existing rows are updated correctly
            return new Promise((res, rej) => {
                adapter.write("test", 1 as any, { name: "Testing" }, (row) => {
                    adapter.read("test", row.id, (row) => {
                        const condition = equals(row, {name: "Testing", id: 1, posts: [1, 2]});
                        myConsole.assert(condition, "Update Test");
                        condition ? res() : rej(row);
                    });
                });
            });
        }).then(() => {
            // Make sure existing rows are replaced correctly
            return new Promise((res, rej) => {
                adapter.write("test", 1 as any, { name: "Testing" }, (row) => {
                    adapter.read("test", row.id, (row) => {
                        const condition = equals(row, {name: "Testing", id: 1});
                        myConsole.assert(condition, "Replace Test");
                        condition ? res() : rej(row);
                    });
                });
            });
        }).then(() => {
            return new Promise((res, rej) => {
                adapter.destroy(res);
            });
        });
    }

    public PrimaryKeys() {
        const adapter: NanoSQLStorageAdapter = new this.adapter(...this.args);

        return new Promise((res, rej) => {
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
        }).then(() => {
            
            // Auto incriment test
            return new Promise((res, rej) => {
                adapter.write("test", null, { name: "Test" }, (row) => {
                    const condition = equals(row, {name: "Test", id: 1});
                    myConsole.assert(condition, "Test Auto Incriment Integer.");
                    condition ? res() : rej(row);
                });
            });
        }).then(() => {
            // UUID test
            return new Promise((res, rej) => {
                adapter.write("test2", null, { name: "Test" }, (row) => {
                    const condition = row.id.match(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/);
                    myConsole.assert(condition, "Test UUID.");
                    condition ? res() : rej(row.id);
                });
            });
        }).then(() => {
            // TimeID Test
            return new Promise((res, rej) => {
                adapter.write("test3", null, { name: "Test" }, (row) => {
                    const condition = row.id.match(/^\w{10}-\w{1,5}$/);
                    myConsole.assert(condition, "Test timeId.");
                    condition ? res() : rej(row.id);
                });
            });
        }).then(() => {
            // TimeIDMS test
            return new Promise((res, rej) => {
                adapter.write("test4", null, { name: "Test" }, (row) => {
                    const condition = row.id.match(/^\w{13}-\w{1,5}$/);
                    myConsole.assert(condition, "Test timeIdms.");
                    condition ? res() : rej(row.id);
                });
            });
        }).then(() => {
            // Ordered Primary Key Test
            return new Promise((res, rej) => {
                let UUIDs: any[] = [];

                for (let i = 0; i < 20; i ++) {
                    UUIDs.push(uuid());
                }

                fastCHAIN(UUIDs, (uuid, i, done) => {
                    adapter.write("test5", uuid, { name: "Test" }, done);
                }).then(() => {

                    UUIDs.sort();

                    let keys: any[] = [];
                    adapter.rangeRead("test5", (row, idx, next) => {
                        keys.push(row.id);
                        next();
                    }, () => {
                        const condition = equals(keys, UUIDs);
                        myConsole.assert(condition, "Test Sorted Primary Keys.");
                        condition ? res() : rej({e: UUIDs, g: keys});
                    }, undefined, undefined);
                });
            });
        }).then(() => {
            return new Promise((res, rej) => {
                adapter.destroy(res);
            });
        });
    }
}