@echo off
echo Testing PostgreSQL connection...
echo.
echo Trying to connect to PostgreSQL...
psql -U postgres -d postgres -c "SELECT version();"
if %errorlevel% equ 0 (
    echo.
    echo ✅ Connection successful!
    echo.
    echo Now creating the poi_ftth_db database...
    psql -U postgres -d postgres -c "CREATE DATABASE poi_ftth_db;"
    if %errorlevel% equ 0 (
        echo ✅ Database created successfully!
    ) else (
        echo Database might already exist, checking...
        psql -U postgres -d postgres -c "\l poi_ftth_db"
    )
) else (
    echo.
    echo ❌ Connection failed. Please check your PostgreSQL password.
    echo.
    echo To reset your postgres user password:
    echo 1. Open pgAdmin
    echo 2. Right-click on 'postgres' user under Login/Group Roles
    echo 3. Select Properties and set a new password
    echo.
    echo Or use this command in psql:
    echo ALTER USER postgres WITH PASSWORD 'your_new_password';
)
pause
