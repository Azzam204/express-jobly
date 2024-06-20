"use strict"


const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");
const Job = require("../models/job");


let id;


beforeAll(async function () {
  await commonBeforeAll();

  let res = await db.query(`SELECT * FROM jobs WHERE title = 'j1'`)

  id = res.rows[0].id;
});

beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


// POST /jobs


describe("POST /jobs", function () {
  const newJob = {
    title: 'new job',
    salary: 100000,
    equity: 0.5,
    companyHandle: 'c3'
  };

  test(" ok for admins", async function () {


    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);

    const job = await db.query(`SELECT id FROM jobs WHERE title = 'new job'`);

    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: { id: job.rows[0].id, ...newJob }
    });
  });

  test('unauth for users', async function () {
    const resp = await request(app)
      .post('/jobs')
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);

    expect(resp.statusCode).toEqual(401);
  });

  test('bad request with missing data', async function () {
    const resp = await request(app)
      .post('/jobs')
      .send({ title: 'new job' })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(400);
  });

  test('bad request with invalid data', async function () {
    const resp = await request(app)
      .post('/jobs')
      .send({
        ...newJob,
        companyHandle: 11
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(400);
  });
});

// GET /jobs

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get('/jobs');

    const jobs = await Job.findAll();

    expect(resp.body).toEqual({
      jobs: [
        {
          id: jobs[0].id,
          title: 'j1',
          salary: 30000,
          equity: 0,
          companyHandle: 'c1'
        },
        {
          id: jobs[1].id,
          title: 'j2',
          salary: 20000,
          equity: 0.2,
          companyHandle: 'c2'
        },
        {
          id: jobs[2].id,
          title: 'j3',
          salary: 10000,
          equity: 0,
          companyHandle: 'c3'
        }
      ]
    });
  });

  test("find by title", async function () {
    const resp = await request(app).get("/jobs")
      .query({ title: 'j1' });

    const jobs = await Job.findAll({ title: 'j1' })

    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: jobs[0].id,
            title: 'j1',
            salary: 30000,
            equity: 0,
            companyHandle: 'c1'
          }
        ]
    });
  });

  test("find by min salary", async function () {
    const resp = await request(app).get("/jobs")
      .query({ minSalary: 25000 });

    const jobs = await Job.findAll({ title: 'j1' })

    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: jobs[0].id,
            title: 'j1',
            salary: 30000,
            equity: 0,
            companyHandle: 'c1'
          }
        ]
    });
  });

  test("find by has equity", async function () {
    const resp = await request(app).get("/jobs")
      .query({ hasEquity: true });

    const jobs = await Job.findAll({ title: 'j2' })

    expect(resp.body).toEqual({
      jobs:
        [
          {
            id: jobs[0].id,
            title: 'j2',
            salary: 20000,
            equity: 0.2,
            companyHandle: 'c2'
          }
        ]
    });
  });

});

// GET /jobs/:id

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${id}`);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      job: {
        id,
        title: 'j1',
        salary: 30000,
        equity: 0,
        companyHandle: 'c1'
      }
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get('/jobs/10000000');
    expect(resp.statusCode).toEqual(404);
  });
});

// PATCH /jobs/:id

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "new j1"
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.body).toEqual({
      job: {
        id,
        title: 'new j1',
        salary: 30000,
        equity: 0,
        companyHandle: 'c1'
      }
    });
  });

  test("unauth for users", async function () {
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        title: "j1-new",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
      .patch(`/jobs/100000`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        id: 11,
      })
      .set("authorization", `Bearer ${adminToken}`);

    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/${id}`)
      .send({
        salary: "not-an-integer",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// DELETE /jobs/:id

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const job = await db.query(`SELECT * FROM jobs WHERE id = ${id}`)
    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: job.rows[0] })
  });

  test("unauth for users", async function () {
    const resp = await request(app)
      .delete(`/jobs/${id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/jobs/${id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/100000`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});