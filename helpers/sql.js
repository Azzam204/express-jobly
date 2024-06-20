const { BadRequestError } = require("../expressError");

// facilitates sql paramitization for data updating. Takes an object containing data that needs to be updated and an object containing sql friendly naming schemes for data.

// returns an object containint setCols (string with all the columns and their parameters) and values (array of js values)

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

// Creates company WHERE constraint for psql query when search filters passed in.


// {name : 'and', minEmployees : 12 , maxEmployees : 993} => "WHERE name ILIKE '%and%' AND num_employees >= 12 AND num_employees <= 992"


function sqlMakeCompWhere(data = {}) {

  const { name, minEmployees, maxEmployees } = data;

  const constraints = [];

  if (name) constraints.push(`name ILIKE '%${name}%'`);
  if (minEmployees) constraints.push(`num_employees >= ${minEmployees}`);
  if (maxEmployees) constraints.push(
    !minEmployees ?
      `num_employees <= ${maxEmployees} OR num_employees IS NULL` :
      `num_employees <= ${maxEmployees}`);

  if (constraints.length > 0) {
    return `WHERE ${constraints.join(' AND ')}`
  }

  return ''

};

/*Creates WHERE constraint from data. Accepts data and returns string

{title, minSalary, hasEquity} => "WHERE title ILIKE [title] AND salary > [minSalary] AND equity > 0"

*/ 


function sqlMakeJobWhere(data = {}) {

  const { title, minSalary, hasEquity } = data;

  const constraints = [];

  if (title) constraints.push(`title ILIKE '%${title}%'`);
  if (minSalary) constraints.push(`salary > ${minSalary}`);
  if (hasEquity) constraints.push(`equity > 0`);

  if (constraints.length > 0) return `WHERE ${constraints.join(' AND ')}`

  return ''

};


module.exports = { sqlForPartialUpdate, sqlMakeCompWhere, sqlMakeJobWhere };
