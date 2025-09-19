# Scripts Directory

This directory contains utility scripts for data management and maintenance of the BEL Management Portal.

## Scripts Overview

### `check_data.py`
**Purpose**: Data validation tool
- Validates the integrity of belProfiles.json data
- Checks user data structure and levels
- Useful for debugging and data verification

**Usage**: 
```bash
cd scripts
python3 check_data.py
```

### `update_questiontime.py`
**Purpose**: Contact support data maintenance
- Updates question times for support tickets
- Maintains contactSupport.json data structure

**Usage**: 
```bash
cd scripts
python3 update_questiontime.py
```

### `update_realistic_data.py`
**Purpose**: Realistic data generation tool
- Generates realistic monthly data for BEL users (2024-2025)
- Maintains proper level hierarchy and business logic
- Creates meaningful performance data for charts and analytics

**Usage**: 
```bash
cd scripts
python3 update_realistic_data.py
```

## Important Notes

- These scripts should be run from the `scripts/` directory
- Always backup data before running any modification scripts
- The data generation scripts use specific business rules for level hierarchy:
  - Builder(1) < Enabler(2) < Exploder(3) < Leader(4)
- All scripts are designed to work with the current data structure

## Archive

Previously removed scripts (tasks completed):
- `add_banking_info.py` - Banking information migration (completed)
- `update_bel_profiles_level.py` - Explorer→Exploder rename (completed)
- `update_product_catalog_level.py` - Product catalog level update (completed)
- `scale_down_data.py` - Data scaling (completed)
- `fix_level_hierarchy.py` - Level hierarchy fix (completed)
- Various verification and validation scripts (completed)
