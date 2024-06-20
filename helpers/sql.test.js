

const { sqlForPartialUpdate, sqlMakeCompWhere, sqlMakeJobWhere } = require('./sql')

const data = {
    firstname: "paul",
    lastname: "walker",
    age: 30,
    location: 'nyc'
};

const jsToSql = {
    firstname: "first_name",
    lastname: "last_name",
    age: "age",
    location: "location"
};

describe("Returns paramaterized string & array of new values", function () {
    test("works", function () {
        const testObj = sqlForPartialUpdate(data, jsToSql);

        expect(testObj.setCols).toEqual('"first_name"=$1, "last_name"=$2, "age"=$3, "location"=$4');
        expect(testObj.values).toEqual(['paul', 'walker', 30, 'nyc'])
    });
});


describe("Returns company sql WHERE constraint from passed in filter object", function () {

    test("only name passed in", function () {

        const testWhere = sqlMakeCompWhere({ name: 'test' })

        expect(testWhere).toEqual(`WHERE name ILIKE '%test%'`)
    });

    test("only minEmployees passed in", function () {

        const testWhere = sqlMakeCompWhere({ minEmployees: 12 })

        expect(testWhere).toEqual(`WHERE num_employees >= 12`)
    });

    test("only maxEmployees passed in (includes null results)", function () {

        const testWhere = sqlMakeCompWhere({ maxEmployees: 12 })

        expect(testWhere).toEqual(`WHERE num_employees <= 12 OR num_employees IS NULL`)
    });

    test("multiple filters passed in ", function () {

        const testWhere = sqlMakeCompWhere({
            maxEmployees: 12,
            minEmployees: 1,
            name: "test"
        })

        expect(testWhere).toEqual(`WHERE name ILIKE '%test%' AND num_employees >= 1 AND num_employees <= 12`)
    });
});

describe("Returns job sql WHERE constraints from passed filter object", function () {

    test('only title passed in', function () {
        const testWhere = sqlMakeJobWhere({ title: 'test' });
        expect(testWhere).toEqual(`WHERE title ILIKE '%test%'`);
    });

    test('only minSalary passed in', function () {
        const testWhere = sqlMakeJobWhere({ minSalary: 200 });
        expect(testWhere).toEqual(`WHERE salary > 200`);
    });

    test('only hasEquity passed in', function () {
        const testWhere = sqlMakeJobWhere({ hasEquity: true });
        expect(testWhere).toEqual(`WHERE equity > 0`);
    });

    test('all filters passed in', function () {
        const testWhere = sqlMakeJobWhere({
            title: 'test',
            minSalary: 200,
            hasEquity: true
        });
        expect(testWhere).toEqual(`WHERE title ILIKE '%test%' AND salary > 200 AND equity > 0`);
    });
});