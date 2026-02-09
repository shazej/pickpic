
-- Insert Super Admin Role if not exists
IF NOT EXISTS (SELECT * FROM roles WHERE name = 'super_admin')
BEGIN
    INSERT INTO roles (name) VALUES ('super_admin');
END

-- Variables
DECLARE @Email NVARCHAR(255) = 'admin@pickpic.com';
DECLARE @PasswordHash NVARCHAR(255) = '$2b$10$HxRXHK/zJe0K/7U6HfDTkekzgGvW8PwuVx2L/KvtGAqLfhgnCvsFy'; -- 'Admin123!'
DECLARE @UserId UNIQUEIDENTIFIER;
DECLARE @RoleId INT;

-- Get Super Admin Role ID
SELECT @RoleId = id FROM roles WHERE name = 'super_admin';

-- Insert User if not exists
IF NOT EXISTS (SELECT * FROM users WHERE email = @Email)
BEGIN
    -- Insert new user
    SET @UserId = NEWID();
    INSERT INTO users (id, email, password_hash, full_name, is_verified, created_at)
    VALUES (@UserId, @Email, @PasswordHash, 'Super Admin', 1, SYSDATETIMEOFFSET());
    
    -- Assign Role
    INSERT INTO user_roles (user_id, role_id)
    VALUES (@UserId, @RoleId);

    PRINT 'Super Admin user created successfully.';
END
ELSE
BEGIN
    -- Update existing user to be super_admin if exists
    SELECT @UserId = id FROM users WHERE email = @Email;
    
    -- Ensure role exists
    IF NOT EXISTS (SELECT * FROM user_roles WHERE user_id = @UserId AND role_id = @RoleId)
    BEGIN
        INSERT INTO user_roles (user_id, role_id) VALUES (@UserId, @RoleId);
        PRINT 'Existing user promoted to Super Admin.';
    END
    ELSE
    BEGIN
        PRINT 'User already exists and has Super Admin role.';
    END
END
