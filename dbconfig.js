import mysql from 'mysql'

var connection = mysql.createConnection({
    host     : 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    user     : '31fLCtY7yKCexZJ.root',
    password : 'wJpy1jpugveBF9ch',
    port     : 4000,
    database : 'ott',
    ssl: {
        // Use 'Amazon RDS' for SSL with AWS databases, or provide cert if required
        rejectUnauthorized: true  // This ensures SSL certificate is validated
    },
    connectionLimit: 10, // Number of connections in the pool
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database.');
});

setInterval(() => {
    connection.ping((err) => {
        if (err) {
            console.error('Ping error:', err);
        } else {
            console.log('Ping successful, connection is alive.');
        }
    });
}, 60000); 

export const queryData = (query) => {
    return new Promise((resolve, reject) => {
        connection.query(query, (error, results) => {
            if (error) {
                return reject(error);  // Reject the promise if there's an error
            }
            resolve(results);  // Resolve the promise with the query results
        });
    });
}

export default connection;