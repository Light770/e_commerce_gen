-- Insert initial roles if they don't exist
INSERT INTO roles (name, description) 
SELECT 'admin', 'Administrator with full access'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin');

INSERT INTO roles (name, description)
SELECT 'user', 'Regular user with limited access'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'user');

-- Insert default tools
INSERT INTO tools (name, description, icon, is_active) 
SELECT 'Data Analyzer', 'Analyze and visualize your data', 'chart-bar', true
WHERE NOT EXISTS (SELECT 1 FROM tools WHERE name = 'Data Analyzer');

INSERT INTO tools (name, description, icon, is_active)
SELECT 'Text Processor', 'Process and transform text content', 'file-text', true
WHERE NOT EXISTS (SELECT 1 FROM tools WHERE name = 'Text Processor');

INSERT INTO tools (name, description, icon, is_active)
SELECT 'Image Editor', 'Edit and optimize images', 'image', true
WHERE NOT EXISTS (SELECT 1 FROM tools WHERE name = 'Image Editor');

-- Note: We don't insert admin user here because we'll do it from the backend
-- with proper password hashing during first run