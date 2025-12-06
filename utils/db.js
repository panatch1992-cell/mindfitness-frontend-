/**
 * Database Utility - MySQL Connection
 * MindFitness Backend
 *
 * Environment Variables Required:
 * - DB_HOST: MySQL host (e.g., mysql.hostinger.com)
 * - DB_NAME: Database name (u786472860_mindfitness_pa)
 * - DB_USER: Database username
 * - DB_PASSWORD: Database password
 * - DB_PORT: MySQL port (default: 3306)
 */

const mysql = require('mysql2/promise');

// Connection pool configuration
let pool = null;

/**
 * Get database connection pool
 * Uses connection pooling for better performance
 */
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'u786472860_mindfitness_pa',
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Security settings
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    });
  }
  return pool;
}

/**
 * Execute a query with parameterized values (prevents SQL injection)
 * @param {string} sql - SQL query with ? placeholders
 * @param {Array} params - Array of parameter values
 * @returns {Promise<Array>} Query results
 */
async function query(sql, params = []) {
  const pool = getPool();
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

/**
 * Execute a query and return single row
 * @param {string} sql - SQL query with ? placeholders
 * @param {Array} params - Array of parameter values
 * @returns {Promise<Object|null>} Single row or null
 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Insert a row and return the inserted ID
 * @param {string} table - Table name
 * @param {Object} data - Object with column:value pairs
 * @returns {Promise<number>} Inserted row ID
 */
async function insert(table, data) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const placeholders = columns.map(() => '?').join(', ');

  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  const pool = getPool();

  try {
    const [result] = await pool.execute(sql, values);
    return result.insertId;
  } catch (error) {
    console.error('Database insert error:', error.message);
    throw error;
  }
}

/**
 * Update rows in a table
 * @param {string} table - Table name
 * @param {Object} data - Object with column:value pairs to update
 * @param {string} whereClause - WHERE clause (e.g., "id = ?")
 * @param {Array} whereParams - Parameters for WHERE clause
 * @returns {Promise<number>} Number of affected rows
 */
async function update(table, data, whereClause, whereParams = []) {
  const columns = Object.keys(data);
  const values = Object.values(data);
  const setClause = columns.map(col => `${col} = ?`).join(', ');

  const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
  const pool = getPool();

  try {
    const [result] = await pool.execute(sql, [...values, ...whereParams]);
    return result.affectedRows;
  } catch (error) {
    console.error('Database update error:', error.message);
    throw error;
  }
}

/**
 * Delete rows from a table
 * @param {string} table - Table name
 * @param {string} whereClause - WHERE clause (e.g., "id = ?")
 * @param {Array} whereParams - Parameters for WHERE clause
 * @returns {Promise<number>} Number of affected rows
 */
async function remove(table, whereClause, whereParams = []) {
  const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
  const pool = getPool();

  try {
    const [result] = await pool.execute(sql, whereParams);
    return result.affectedRows;
  } catch (error) {
    console.error('Database delete error:', error.message);
    throw error;
  }
}

/**
 * Check database connection
 * @returns {Promise<boolean>} Connection status
 */
async function checkConnection() {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    return false;
  }
}

/**
 * Close connection pool (for graceful shutdown)
 */
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  query,
  queryOne,
  insert,
  update,
  remove,
  checkConnection,
  closePool
};
