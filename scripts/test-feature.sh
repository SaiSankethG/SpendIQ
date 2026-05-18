#!/bin/bash

# Test Feature Script - Run Playwright tests for a specific feature
# Usage: ./scripts/test-feature.sh FEAT-001

set -e

FEATURE=$1
REPO_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

if [ -z "$FEATURE" ]; then
  echo "❌ Usage: ./scripts/test-feature.sh FEATURE_ID"
  echo ""
  echo "Examples:"
  echo "  ./scripts/test-feature.sh FEAT-001"
  echo "  ./scripts/test-feature.sh date-filter"
  exit 1
fi

echo "🧪 Testing feature: $FEATURE"
echo ""

# Find requirement file
REQUIREMENT_FILES=$(find "$REPO_ROOT/docs/requirements" -name "*$FEATURE*" 2>/dev/null || true)

if [ -z "$REQUIREMENT_FILES" ]; then
  echo "⚠️  No requirement file found matching '$FEATURE'"
  echo "   Looking in: docs/requirements/"
else
  echo "📋 Found requirement(s):"
  echo "$REQUIREMENT_FILES"
  echo ""
fi

# Find test file
TEST_FILE=""
for file in "$REPO_ROOT/frontend/tests/e2e"/*"$FEATURE"*.spec.ts; do
  if [ -f "$file" ]; then
    TEST_FILE="$file"
    break
  fi
done

if [ -z "$TEST_FILE" ]; then
  # Try alternative naming
  FEATURE_NAME=$(echo "$FEATURE" | sed 's/^FEAT-[0-9]*-//' | tr '_' '-')
  for file in "$REPO_ROOT/frontend/tests/e2e"/*"$FEATURE_NAME"*.spec.ts; do
    if [ -f "$file" ]; then
      TEST_FILE="$file"
      break
    fi
  done
fi

if [ -z "$TEST_FILE" ]; then
  echo "❌ No test file found for feature '$FEATURE'"
  echo "   Looking in: frontend/tests/e2e/"
  echo ""
  echo "💡 You can create tests with:"
  echo "   'Ask the Testing Agent to create tests for $FEATURE'"
  exit 1
fi

echo "✅ Found test file: $TEST_FILE"
echo ""

# Run tests
cd "$REPO_ROOT/frontend"

echo "🚀 Running tests..."
echo ""

if [ "$2" == "--headed" ]; then
  npx playwright test -g "$FEATURE" --headed
elif [ "$2" == "--debug" ]; then
  npx playwright test -g "$FEATURE" --debug
elif [ "$2" == "--ui" ]; then
  npx playwright test -g "$FEATURE" --ui
else
  npx playwright test -g "$FEATURE"
fi

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ All tests passed for feature: $FEATURE"
  echo ""
  echo "📊 View detailed report:"
  echo "   npm run test:report"
else
  echo ""
  echo "❌ Some tests failed for feature: $FEATURE"
  echo ""
  echo "🐛 Debug the tests:"
  echo "   ./scripts/test-feature.sh $FEATURE --debug"
  echo ""
  echo "🎬 View test videos:"
  echo "   ls -la frontend/test-results/"
fi

exit $EXIT_CODE
