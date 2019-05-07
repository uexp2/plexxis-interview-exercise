const { Client } = require('pg')
const fs = require('fs')
const dotenv = require('dotenv')
dotenv.config()

const client = new Client({ connectionString: process.env.DATABASE_URL })
client.connect()
let sql = fs.readFileSync(`db-scripts/${process.argv[2]}`).toString()

console.log(`RUNNING SCRIPT ${process.argv[2]}`)
client.query(sql)
  .then(() => {
    console.log(`FINISHED SCRIPT ${process.argv[2]}`)
    sql = fs.readFileSync(`db-scripts/${process.argv[3]}`).toString()
    console.log(`RUNNING SCRIPT ${process.argv[3]}`)
    return client.query(sql)
  })
  .then(() => {
    console.log(`FINISHED SCRIPT ${process.argv[3]}`)
    client.end()
  })
  .catch(err => {
    console.log(err)
    client.end()
  })