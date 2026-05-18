#!/bin/bash

# New Requirement Script - Create a new feature requirement file
# Usage: ./scripts/new-requirement.sh FEAT-001 "Feature Name"

set -e

FEATURE_ID=$1
FEATURE_NAME=$2
REPO_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
REQUIREMENTS_DIR="$REPO_ROOT/docs/requirements"

if [ -z "$FEATURE_ID" ] || [ -z "$FEATURE_NAME" ]; then
  echo "❌ Usage: ./scripts/new-requirement.sh FEATURE_ID 'Feature Name'"
  echo ""
  echo "Examples:"
  echo "  ./scripts/new-requirement.sh FEAT-001 'Transaction Date Filter'"
  echo "  ./scripts/new-requirement.sh FEAT-002 'Budget Notifications'"
  exit 1
fi

# Create directory if it doesn't exist
mkdir -p "$REQUIREMENTS_DIR"

# Generate filename
FEATURE_SLUG=$(echo "$FEATURE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | sed 's/[^a-z0-9-]*//g')
FILENAME="${REQUIREMENTS_DIR}/${FEATURE_ID}-${FEATURE_SLUG}.md"

if [ -f "$FILENAME" ]; then
  echo "❌ Requirement file already exists: $FILENAME"
  exit 1
fi

# Create the requirement file
cat > "$FILENAME" << EOF
---
feature_id: $FEATURE_ID
status: draft
priority: high
created_date: $(date +%Y-%m-%d)
author: \$(git config user.name)
---

# Feature: $FEATURE_NAME

## User Story
As a [user type], I want to [action], so that [benefit].

## Acceptance Criteria
- [ ] **Criterion 1**: Describe what should happen
- [ ] **Criterion 2**: Describe another aspect
- [ ] **Criterion 3**: Describe third aspect

## Technical Requirements

### Backend
- [ ] Describe what backend needs to do
- [ ] API endpoint or database change
- [ ] Any new models or services

### Frontend
- [ ] Describe what frontend needs to do
- [ ] New React components
- [ ] UI changes or integrations

### Database (if applicable)
- [ ] Schema changes
- [ ] Migrations needed
- [ ] Indexes for performance

## Dependencies
- List any features this depends on
- Link to other requirement files if needed

## Test Scenarios

### Happy Path (Normal Flow)
1. User performs action X
2. Expected result Y
3. Verification Z

### Edge Cases
1. What if there's no data?
2. What if user enters invalid input?
3. What if concurrent actions happen?

### Error Handling
1. Network error - should show error message
2. Invalid input - should validate and show error
3. Database error - should gracefully handle

## API Endpoints (if applicable)

### Endpoint 1
\`\`\`
GET /api/endpoint/{id}
Description: Get something
Query Params: filter, sort
Response: JSON object
\`\`\`

### Endpoint 2
\`\`\`
POST /api/endpoint
Description: Create something
Body: JSON object with fields
Response: Created object with ID
\`\`\`

## UI Components (if applicable)

### Component 1: ComponentName
- Purpose: What does this component do?
- Props: What does it accept?
- Events: What does it emit?
- Styling: Any special styling needs?

## Implementation Notes

Add any additional context, design considerations, or implementation hints here.

## References

- Link to design mockup (if available)
- Link to related documentation
- Link to related features

## Checklist

- [ ] Requirements approved by stakeholder
- [ ] Technical design reviewed
- [ ] Acceptance criteria clear and testable
- [ ] Dependencies identified
- [ ] Test scenarios defined
EOF

echo "✅ Created requirement file:"
echo "   $FILENAME"
echo ""
echo "📝 Next steps:"
echo "   1. Edit the file to add details"
echo "   2. Ask the Development Agent to implement this feature"
echo "   3. Ask the Testing Agent to create tests"
echo ""
echo "📂 View file:"
echo "   cat $FILENAME"
echo ""
echo "📋 Create a test for this feature:"
echo "   ./scripts/test-feature.sh $FEATURE_ID"
