-- Migration: add users + user_id on projects (for existing DBs)
USE thang;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_email (email(191)),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- If projects already exists without user_id, run carefully:
-- 1) Create admin user first via app seed
-- 2) Then:
-- ALTER TABLE projects ADD COLUMN user_id INT NULL;
-- UPDATE projects SET user_id = 1 WHERE user_id IS NULL;
-- ALTER TABLE projects MODIFY user_id INT NOT NULL;
-- ALTER TABLE projects ADD CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE projects DROP INDEX unique_project_name;
-- ALTER TABLE projects ADD UNIQUE KEY unique_user_project (user_id, project_name(100));

SELECT 'migration-auth: ensure users table exists' AS status;
