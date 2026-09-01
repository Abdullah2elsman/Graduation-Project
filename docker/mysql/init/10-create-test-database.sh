#!/bin/bash
set -e

TEST_DATABASE="${MYSQL_TEST_DATABASE:-smart_book_v2_test}"

echo "Creating test database: ${TEST_DATABASE}"

mysql --protocol=socket \
    -uroot \
    -p"${MYSQL_ROOT_PASSWORD}" <<SQL
CREATE DATABASE IF NOT EXISTS \`${TEST_DATABASE}\`;

GRANT ALL PRIVILEGES
    ON \`${TEST_DATABASE}\`.*
    TO '${MYSQL_USER}'@'%';

FLUSH PRIVILEGES;
SQL

echo "Test database ready: ${TEST_DATABASE}"
