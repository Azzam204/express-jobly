"use strict";

const db = require('../db');
const { NotFoundError } = require('../expressError');
const { sqlForPartialUpdate, sqlMakeJobWhere} = require('../helpers/sql')

// related functions for jobs

class Job {
    // create job from data, update db.

    // returns {id,title,salary,equity,companyHandle}

    static async create({ title, salary, equity, companyHandle }) {

        const result = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES($1,$2,$3,$4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                title,
                salary,
                equity,
                companyHandle
            ]
        );

        return result.rows[0]
    };


      /** Find all jobs.
   * 
   * accepts optional data for filtering
   * data = {title , minSalary, hasEquity }
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */


    static async findAll(data = {}) {

        const jobsRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            ${sqlMakeJobWhere(data)}
            ORDER BY title`
        )

        return jobsRes.rows
    };


      /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

    static async get(id) {

        const jobRes = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle" 
            FROM jobs
            WHERE id = $1`, [id]
        );

        const job = jobRes.rows[0]

        if (!job) throw new NotFoundError(`No job with id of ${id}`)

        return job
    };

      /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, hasEquity}
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */


    static async update(jobId, data) {

        const { setCols, values } = sqlForPartialUpdate(data, {});

        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                          SET ${setCols}
                          WHERE id = ${idVarIdx}
                          RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;

        const result = await db.query(querySql, [...values, jobId]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with id of ${jobId}`);

        return job
    };

      /** Delete given job from database; returns job.
   *
   * Throws NotFoundError if company not found.
   **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
               FROM jobs
               WHERE id = $1
               RETURNING *`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No company: ${id}`);

        return job
    };
};

module.exports = Job;