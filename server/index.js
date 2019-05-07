const express = require('express')
const cors = require('cors')
const app = express()
const { Client } = require('pg')
const bodyParser = require('body-parser');

require('dotenv').config()


const client = new Client({ connectionString: process.env.DATABASE_URL })
client.connect()
.catch(err => {
  console.error(err)
})

var corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost'],
  optionsSuccessStatus: 200
}

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/api/employees', cors(corsOptions), (req, res, next) => {
  // let {limit, offset} = req.query;

  // // Check if limit is valid and not greater than DATABASE_ROW_LIMIT
  // const parsedLimit = limit ? parseInt(limit) : null;
  // if (!limit || (!isNaN(parsedLimit) && parsedLimit > process.env.DATABASE_ROW_LIMIT)) {
  //   limit = process.env.DATABASE_ROW_LIMIT
  // } else if (isNaN(limit)) {
  //   return res.status(400).send('Bad parameter(s).')
  // }

  // // Check if offset is valid
  // if (offset && isNaN(parseInt(offset))) {
  //   return res.status(400).send('Bad parameter(s).')
  // } else if (!offset) {
  //   offset = 0
  // }

  // client.query('SELECT fstlstname as name, * FROM employees LIMIT $1 OFFSET $2;', [limit, offset])
  client.query('SELECT fstlstname as name, * FROM employees;')
  .then(dbres => {
    // fstlstname is removed since it is not a recognized key by the client
    dbres.rows.forEach(employee => {
      delete employee['fstlstname']
    })
    res.setHeader('Content-Type', 'application/json');
    res.status(200);
    res.send(JSON.stringify(dbres.rows, null, 2))
  })
  .catch(err => {
    console.error(err);
    res.status(500).send();
  })
})

//Create new employee
app.post('/api/employees', cors(corsOptions), (req, res, next) => {
  const arrayEmployees = req.body;  // array of objects
  
  const queryValues = [];
  const expectedDataFields = [
    'name', 'code', 'profession', 'color', 'city', 'branch', 'assigned'
  ];

  const employeesNotInserted  = [];

  const queryStringRowEntry = [];
  let valueRowString;
  let count = 0;
  arrayEmployees.forEach(employee => {
    if (!employee['name']) {
      employeesNotInserted.push(employee);
      return; // continue
    }
    // queryString placeholder constructor
    // ($1, $2, ..., $7)
    valueRowString = `
      (${
        expectedDataFields
        .map((key, j) => '$'.concat(count*expectedDataFields.length + (j + 1)))
        .join(',')
      })
    `;
    // push values into queryValues
    expectedDataFields.forEach(key => {
      if (!employee[key]) { 
        queryValues.push(null);
      } else {
        queryValues.push(employee[key]);
      }
    })
    queryStringRowEntry.push(valueRowString);
    count ++;
  })

  // Nothing valid can be added
  if (!count) {
    res.status(400);
    res.send();
    return;
  }

  const queryString = `
    INSERT INTO employees (fstlstname, code, profession, color, city, branch, assigned)
    VALUES ${queryStringRowEntry.join(',')};
  `;

  client.query(queryString, queryValues)
  .then(() => {
    if (count !== arrayEmployees.length) {  // not all requested inserts inserted
      res.setHeader('Content-Type', 'application/json');
      res.status(202);
      res.send(employeesNotInserted);
    } else {
      res.status(201).send();
    }
  })
  .catch(err => {
    console.log(err)
    res.status(500).send()
  })
})

app.options('/api/employees', cors(corsOptions)) // Enable pre-flight request

// edit employees
app.patch('/api/employees', cors(corsOptions), (req, res, next) => {
  const arrayEmployees = req.body;  // array of objects
  
  const queryValues = [];
  const allEmployeeColumns = [
    'id', 'fstlstname', 'code', 'profession', 'color', 'city', 'branch', 'assigned'
  ];
  const editableEmployeeTableColumns = [
    'fstlstname', 'code', 'profession', 'color', 'city', 'branch', 'assigned'
  ];
  const type = {'id': 'INTEGER', 'assigned': 'BOOLEAN'};

  const employeesNotUpdated  = [];

  const queryStringRowEntry = [];
  let valueRowString;
  let count = 0;
  arrayEmployees.forEach(employee => {
    if (!employee['id'] 
      || isNaN(employee['id'] = parseInt(employee['id']))
      || employee['name'] === '' || employee['name'] === null) {  // cannot clear name
      employeesNotUpdated.push(employee);
      return; // continue;
    }

    // Only ID was given, do nothing.
    if (Object.keys(employee).length <= 1) return;  // continue;

    // create db recognized key
    employee['fstlstname'] = employee['name'];

    // queryString placeholder constructor
    // ($1, $2, ..., $8)
    valueRowString = `
      (${
        allEmployeeColumns
        .map((key, j) => {
          let ret = '$'.concat(count*allEmployeeColumns.length + (j + 1));
          if (key in type) ret = ret.concat('::').concat(type[key]);
          return ret;
        })
        .join(',')
      })
    `;
    // push values into queryValues
    allEmployeeColumns.forEach(key => {
      if (!employee[key]) { 
        queryValues.push(null);
      } else {
        queryValues.push(employee[key]);
      }
    })
    queryStringRowEntry.push(valueRowString);
    count ++;
  })

  // Nothing valid can be added
  if (!count) {
    res.status(400);
    res.send();
    return;
  }

  // Construct Query
  const querySetFieldConstructor = 
    editableEmployeeTableColumns.map(col => {
      if (col === 'assigned') return `${col} = tmpt.${col}`
      return `${col} = COALESCE(tmpt.${col}, e.${col})`
    })
    .join(','); 
  const queryString = `
    UPDATE employees as e SET ${querySetFieldConstructor}
    FROM (VALUES ${queryStringRowEntry.join(',')}) as tmpt(${allEmployeeColumns.join(',')})
    WHERE e.id = tmpt.id
    RETURNING *;
  `;

  client.query(queryString, queryValues)
  .then((dbRes) => {
    // not all requested employees edited
    if (dbRes.rowCount < arrayEmployees.length) {
      res.setHeader('Content-Type', 'application/json');
      res.status(202);
      res.send(employeesNotUpdated);
    } else {
      res.status(201).send();
    }
  })
  .catch(err => {
    console.log(err)
    res.status(500).send()
  })
})

app.delete('/api/employees', cors(corsOptions), (req, res, next) => {
  const { arrayIds } = req.body;
  if (!arrayIds || !Array.isArray(arrayIds) || arrayIds.length === 0) { 
    return res.status(400).send('No ID(s) provided.');
  }
  let queryString;
  if (arrayIds.length > 1) {
    queryString = `DELETE FROM employees WHERE id IN (${arrayIds.map((id, i)=> '$' + (i + 1)).join(',')});`;
  } else {
    queryString = 'DELETE FROM employees WHERE id = $1;'
  }

  client.query(queryString, arrayIds)
  .then(() => {
    res.status(200).send();
  })
  .catch((err) => {
    res.status(500).send();
  })
})

app.listen(8080, () => console.log('Job Dispatch API running on port 8080!'))