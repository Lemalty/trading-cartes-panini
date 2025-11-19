import { DataSource, DataSourceOptions } from 'typeorm';

let dataSource: DataSource | null = null;

/**
 * This function initializes a connection to the database using the TypeORM library.
 * TypeORM is an Object-Relational Mapping (ORM) library that provides a way to use
 * entity objects to interact with your database in an object-oriented manner.
 *
 * @param {DataSourceOptions} options - The options object for the TypeORM connection. This object
 * can contain various properties to configure the connection, such as type (database type),
 * host, port, username, password, database (database name), entities, etc.
 *
 * @returns {Promise<DataSource>} A Promise that resolves to an instance of the DataSource
 * object, representing a connection to the database. This DataSource object can then be
 * used to perform database operations.
 *
 * @throws {Error} If there is an error while creating the connection, the function will
 * throw an error. This error should be caught and handled by the caller.
 *
 * @async
 */
export async function initializeDbConnection(options: DataSourceOptions): Promise<DataSource> {
    if (dataSource) {
        return dataSource;
    }

    dataSource = new DataSource(options);
    try {
        await dataSource.initialize();
        return dataSource;
    } catch (error) {
        dataSource = null;
        throw error;
    }
}

/**
 * This function returns the current DataSource object representing the connection to the database.
 * If the connection has not been initialized yet, an error is thrown.
 * This function is used to retrieve the DataSource object in other parts of the application
 * where database operations are needed.
 *
 * @returns {DataSource} The DataSource object representing the connection to the database.
 *
 * @throws {Error} If the connection has not been initialized yet, an error is thrown.
 */
export function getDataSource(): DataSource {
    if (!dataSource) {
        throw new Error('Database connection not initialized');
    }
    return dataSource;
}
