"use strict";



const db = require("../db.js");
const Job = require('./job.js');
const { BadRequestError, NotFoundError } = require("../expressError");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");


let id;


beforeAll(async function () {
  await commonBeforeAll();

  let res = await db.query(`SELECT * FROM jobs WHERE title = 'j1'`)

  id = res.rows[0].id;
});

beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


// create

describe('create', function () {
  const newJob = {
    title: 'new',
    salary: 2000,
    equity: 0,
    companyHandle: 'c1'
  };

  test("works", async function () {
    const job = await Job.create(newJob);

    expect(job).toEqual({ id: job.id, ...newJob });

    const result = await db.query(
      `SELECT title,salary,equity,company_handle FROM jobs WHERE title = 'new'`);
    expect(result.rows).toEqual([
      {
        title: 'new',
        salary: 2000,
        equity: 0,
        company_handle: 'c1'
      }
    ])
  });
});

// findAll

describe('findAll', function () {
  test("works: no filter", async function () {
    const job = await Job.findAll();

    expect(job).toEqual([
      {
        id: job[0].id,
        title: 'j1',
        salary: 30000,
        equity: 0,
        companyHandle: 'c1'
      },
      {
        id: job[1].id,
        title: 'j2',
        salary: 20000,
        equity: 0.2,
        companyHandle: 'c2'
      },
      {
        id: job[2].id,
        title: 'j3',
        salary: 10000,
        equity: 0,
        companyHandle: 'c3'
      }
    ]);
  });

  test("works : title filter ", async function () {
    let job = await Job.findAll({ title: 'j1' });
    expect(job).toEqual([
      {
        id: job[0].id,
        title: 'j1',
        salary: 30000,
        equity: 0,
        companyHandle: 'c1'
      }
    ]);
  });
  test("works : salary filter ", async function () {
    let job = await Job.findAll({ minSalary: 25000 });
    expect(job).toEqual([
      {
        id: job[0].id,
        title: 'j1',
        salary: 30000,
        equity: 0,
        companyHandle: 'c1'
      }
    ]);
  });

  test("works : title filter ", async function () {
    let job = await Job.findAll({ hasEquity: true });
    expect(job).toEqual([
      {
        id: job[0].id,
        title: 'j2',
        salary: 20000,
        equity: 0.2,
        companyHandle: 'c2'
      }
    ]);
  });

});

// get

describe("get", function () {
  test("works", async function () {
    const job = await Job.get(id);

    expect(job).toEqual(
      {
        id: job.id,
        title: 'j1',
        salary: 30000,
        equity: 0,
        companyHandle: 'c1'
      }
    );
  });

  test("throws 404 error if not found", async function () {
    try {
      await Job.get(1000);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
      expect(err.status).toEqual(404)
    }
  });
});

describe('update', function () {
  const updateData = {

    title: 'j1',
    salary: 50000,
    equity: 0
  };

  test("works", async function () {

    const job = await Job.update(id, updateData);

    expect(job).toEqual({
      id,
      companyHandle: 'c1',
      ...updateData
    });

    const res = await db.query(`SELECT * FROM jobs WHERE id = ${id}`)

    expect(res.rows).toEqual([{
      id,
      title: 'j1',
      salary: 50000,
      equity: 0,
      company_handle: 'c1'
    }]);
  });

  test("throws 404 error if not found", async function () {
    try {
      await Job.update(1000, updateData);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
      expect(err.status).toEqual(404);
    }
  });

  test("throws 400 bad request error if no data", async function () {

    try {
      await Job.update(id, {})
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
      expect(err.status).toEqual(400);
    }
  });
});

describe("remove", function () {

  test("works", async function () {

    await Job.remove(id);

    const res = await db.query(`SELECT * FROM jobs WHERE id = ${id}`);

    expect(res.rows.length).toEqual(0);
  });

  test("throws 404 error if not found", async function () {
    try {
      await Job.remove(1000);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
      expect(err.status).toEqual(404);
    }
  })
});