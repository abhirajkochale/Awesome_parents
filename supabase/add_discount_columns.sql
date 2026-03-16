-- Add discount columns to admissions table
ALTER TABLE admissions ADD COLUMN discount_amount NUMERIC DEFAULT 0;
ALTER TABLE admissions ADD COLUMN final_fee NUMERIC;

-- Comment for future reference
COMMENT ON COLUMN admissions.discount_amount IS 'Amount discounted from the total fee during approval';
COMMENT ON COLUMN admissions.final_fee IS 'Final payable amount after applying discount';
