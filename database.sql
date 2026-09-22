-- Mosh & Mode Financial Simulator - Normalized MySQL Schema
-- Auth + multi-tenant projects

CREATE DATABASE IF NOT EXISTS thang;
USE thang;

-- Users (auth)
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

-- Projects (owned by user)
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE KEY unique_user_project (user_id, project_name(100)),
  INDEX idx_projects_active (is_active),
  INDEX idx_projects_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Financial Parameters (1 row per project, full ProjectParameters JSON)
CREATE TABLE IF NOT EXISTS financial_parameters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  parameters LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_params (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
  id VARCHAR(100) NOT NULL,
  project_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  payload LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_category_id (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Product SKUs
CREATE TABLE IF NOT EXISTS product_skus (
  id VARCHAR(100) NOT NULL,
  project_id INT NOT NULL,
  category_id VARCHAR(100),
  sku_code VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  type ENUM('single', 'combo') DEFAULT 'single',
  status VARCHAR(50) DEFAULT 'active',
  payload LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_sku_id (id),
  INDEX idx_skus_type (type),
  INDEX idx_category_id (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Sheet3 COGS (keyed by sku_id)
CREATE TABLE IF NOT EXISTS sheet3_cogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  sku_id VARCHAR(100) NOT NULL,
  cogs_per_unit DECIMAL(18, 2),
  moq INT,
  factory_name VARCHAR(255),
  lead_time_days INT,
  payload LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_sku (project_id, sku_id),
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(100) NOT NULL,
  project_id INT NOT NULL,
  factory_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  payload LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_supplier_id (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Product Quotations
CREATE TABLE IF NOT EXISTS product_quotations (
  id VARCHAR(100) NOT NULL,
  project_id INT NOT NULL,
  sku_id VARCHAR(100) NOT NULL,
  supplier_id VARCHAR(100) NOT NULL,
  factory_name VARCHAR(255),
  unit_price DECIMAL(18, 2),
  moq INT,
  lead_time_days INT,
  is_chosen BOOLEAN DEFAULT FALSE,
  payload LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_quotation_id (id),
  INDEX idx_sku_id (sku_id),
  INDEX idx_supplier_id (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Sales Months
CREATE TABLE IF NOT EXISTS sales_months (
  id VARCHAR(100) NOT NULL,
  project_id INT NOT NULL,
  date_str VARCHAR(20),
  month_label VARCHAR(50),
  sort_order INT DEFAULT 0,
  payload LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_month_id (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Sales Volumes
CREATE TABLE IF NOT EXISTS sales_volumes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  sku_id VARCHAR(100) NOT NULL,
  month_id VARCHAR(100) NOT NULL,
  volume INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_sku_month (project_id, sku_id, month_id),
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Channel Mix (one row per channel)
CREATE TABLE IF NOT EXISTS channel_mix_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  channel_name VARCHAR(100) NOT NULL,
  percentage DECIMAL(8, 4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_channel (project_id, channel_name),
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Creator Plan (per month allocation)
CREATE TABLE IF NOT EXISTS creator_plan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  month_id VARCHAR(100) NOT NULL,
  ugc_count INT DEFAULT 0,
  koc_count INT DEFAULT 0,
  kol_count INT DEFAULT 0,
  payload LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_month (project_id, month_id),
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Creator Campaigns
CREATE TABLE IF NOT EXISTS creator_campaigns (
  id VARCHAR(100) NOT NULL,
  project_id INT NOT NULL,
  campaign_name VARCHAR(255),
  description TEXT,
  payload LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_campaign_id (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- HR Positions (salary structure)
CREATE TABLE IF NOT EXISTS hr_positions (
  id VARCHAR(100) NOT NULL,
  project_id INT NOT NULL,
  position_title VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  contract_type VARCHAR(50),
  base_salary DECIMAL(18, 2),
  payload LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_position_id (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- HR Headcount Plan
CREATE TABLE IF NOT EXISTS hr_headcount (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  position_id VARCHAR(100) NOT NULL,
  month_id VARCHAR(100) NOT NULL,
  headcount INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_position_month (project_id, position_id, month_id),
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Initial Capex Items
CREATE TABLE IF NOT EXISTS capex_items (
  id VARCHAR(100) NOT NULL,
  project_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  cost DECIMAL(18, 2),
  depreciation_months INT DEFAULT 0,
  disbursement_month VARCHAR(20),
  payload LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_capex_id (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- Monthly Operating Expenses
CREATE TABLE IF NOT EXISTS opex_items (
  id VARCHAR(100) NOT NULL,
  project_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  monthly_cost DECIMAL(18, 2),
  category VARCHAR(50),
  start_month VARCHAR(20),
  payload LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_opex_id (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- HR Operations Config (key-value + full config blob)
CREATE TABLE IF NOT EXISTS hr_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  config_json LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_project_hr_config (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;
