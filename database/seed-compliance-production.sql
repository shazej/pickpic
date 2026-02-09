-- Seed Countries (Upsert based on Code)
INSERT INTO "Countries" ("Code", "Name", "Currency", "TimeZone", "DefaultLanguage", "Enabled", "Created", "CreatedBy")
VALUES 
('KW', 'Kuwait', 'KWD', 'Asia/Kuwait', 'ar', true, NOW(), 'system'),
('QA', 'Qatar', 'QAR', 'Asia/Qatar', 'ar', true, NOW(), 'system'),
('IQ', 'Iraq', 'IQD', 'Asia/Baghdad', 'ar', true, NOW(), 'system')
ON CONFLICT ("Code") DO NOTHING;

-- Seed Compliance Rules
-- Kuwait Rules
INSERT INTO "ComplianceRules" ("RuleName", "Description", "IsActive", "CountryId", "Created", "CreatedBy")
SELECT 'Consumer Protection Law No. 39/2014', 'Merchants must provide invoices in Arabic. Returns allowed within 14 days for defective items.', true, "Id", NOW(), 'system'
FROM "Countries" WHERE "Code" = 'KW';

INSERT INTO "ComplianceRules" ("RuleName", "Description", "IsActive", "CountryId", "Created", "CreatedBy")
SELECT 'E-Commerce Reg 2021', 'Digital signatures are legally binding. Sellers must display full contact info.', true, "Id", NOW(), 'system'
FROM "Countries" WHERE "Code" = 'KW';

-- Qatar Rules
INSERT INTO "ComplianceRules" ("RuleName", "Description", "IsActive", "CountryId", "Created", "CreatedBy")
SELECT 'Electronic Commerce Law No. 16/2010', 'Providers must ensure data privacy and secure payment channels.', true, "Id", NOW(), 'system'
FROM "Countries" WHERE "Code" = 'QA';

-- Iraq Rules
INSERT INTO "ComplianceRules" ("RuleName", "Description", "IsActive", "CountryId", "Created", "CreatedBy")
SELECT 'Consumer Protection Law No. 1/2010', 'Products must have Arabic labeling. Expiry dates must be clear.', true, "Id", NOW(), 'system'
FROM "Countries" WHERE "Code" = 'IQ';
