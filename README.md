# FYP-Express-Backend

## Set-up
- To run this project, <a href='https://nodejs.org/en/'>Node.js</a> needs to be installed.
- Clone this project, then navigate to the root folder and run the command ``npm install``.
- Ensure that the SQL Server is installed and the database is set up <a href='https://github.com/rachelfinucane/FYP-database'>(instructions and repo here)</a>.
- Ensure that Redis Cache is running.
- In the .env file, replace the `REDIS_HOST` `REDIS_PORT`, `REDIS_SECRET` and `REDIS_PASSWORD` with the values from your Redis instance.
- In the .env file, replace `DB_CONNECTION_STRING` with the connection string to your local SQL Server instance.
- Once this is in place, start Diabetes Diary by running the command `npm start`.
- Navigate to localhost:3000 to view the website.
