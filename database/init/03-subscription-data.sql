-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, stripe_price_id_monthly, stripe_price_id_yearly, features, tool_limit, is_active)
VALUES 
('Free', 'Basic access with limited tool usage', 0, 0, NULL, NULL, '["Access to basic tools", "Limited uses per month", "Community support"]', 3, TRUE),
('Professional', 'Full access for individual professionals', 19.99, 199.99, 'price_monthly_professional', 'price_yearly_professional', '["Unlimited access to all tools", "Priority support", "Advanced analytics", "Save & export all work"]', -1, TRUE),
('Team', 'Collaborate with your entire team', 49.99, 499.99, 'price_monthly_team', 'price_yearly_team', '["Everything in Professional", "Team collaboration features", "Admin dashboard", "Usage reporting", "Dedicated account manager"]', -1, TRUE),
('Enterprise', 'Custom solution for large organizations', 149.99, 1499.99, 'price_monthly_enterprise', 'price_yearly_enterprise', '["Everything in Team", "Custom integrations", "SLA", "Onboarding training", "Enterprise-grade security"]', -1, TRUE);

-- Set premium flag and usage limits for existing tools
UPDATE tools SET is_premium = TRUE, usage_limit_free = 3 WHERE name = "Data Analyzer";
UPDATE tools SET is_premium = TRUE, usage_limit_free = 3 WHERE name = "Image Editor";
UPDATE tools SET is_premium = FALSE, usage_limit_free = -1 WHERE name = "Text Processor";
UPDATE tools SET is_premium = TRUE, usage_limit_free = 1 WHERE name = "Production Checklist";

-- Map tools to plans (which tools are available in which plans)
-- First, get IDs for plans and tools
SET @free_plan_id = (SELECT id FROM subscription_plans WHERE name = 'Free');
SET @pro_plan_id = (SELECT id FROM subscription_plans WHERE name = 'Professional');
SET @team_plan_id = (SELECT id FROM subscription_plans WHERE name = 'Team');
SET @enterprise_plan_id = (SELECT id FROM subscription_plans WHERE name = 'Enterprise');

SET @data_analyzer_id = (SELECT id FROM tools WHERE name = 'Data Analyzer');
SET @text_processor_id = (SELECT id FROM tools WHERE name = 'Text Processor');
SET @image_editor_id = (SELECT id FROM tools WHERE name = 'Image Editor');
SET @checklist_id = (SELECT id FROM tools WHERE name = 'Production Checklist');

-- Insert plan_tools mappings
-- Free plan has limited access
INSERT INTO plan_tools (plan_id, tool_id, usage_limit) 
VALUES
(@free_plan_id, @data_analyzer_id, 3),
(@free_plan_id, @text_processor_id, -1), -- unlimited for non-premium tool
(@free_plan_id, @image_editor_id, 3),
(@free_plan_id, @checklist_id, 1);

-- Professional plan has unlimited access to all tools
INSERT INTO plan_tools (plan_id, tool_id, usage_limit) 
VALUES
(@pro_plan_id, @data_analyzer_id, -1),
(@pro_plan_id, @text_processor_id, -1),
(@pro_plan_id, @image_editor_id, -1),
(@pro_plan_id, @checklist_id, -1);

-- Team plan has unlimited access to all tools
INSERT INTO plan_tools (plan_id, tool_id, usage_limit) 
VALUES
(@team_plan_id, @data_analyzer_id, -1),
(@team_plan_id, @text_processor_id, -1),
(@team_plan_id, @image_editor_id, -1),
(@team_plan_id, @checklist_id, -1);

-- Enterprise plan has unlimited access to all tools
INSERT INTO plan_tools (plan_id, tool_id, usage_limit) 
VALUES
(@enterprise_plan_id, @data_analyzer_id, -1),
(@enterprise_plan_id, @text_processor_id, -1),
(@enterprise_plan_id, @image_editor_id, -1),
(@enterprise_plan_id, @checklist_id, -1);