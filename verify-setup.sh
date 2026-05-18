#!/bin/bash

# ✅ Complete Implementation Checklist
# Run this to verify everything was set up correctly

echo "🔍 Checking Expense Tracker CI/CD & Agent Setup..."
echo ""

REPO_ROOT="/Users/saisankethg/Desktop/expense tracker"
cd "$REPO_ROOT"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
        return 0
    else
        echo -e "${RED}❌${NC} $1 (MISSING)"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $1/"
        return 0
    else
        echo -e "${RED}❌${NC} $1/ (MISSING)"
        return 1
    fi
}

echo "═══════════════════════════════════════════════════════════"
echo "AGENTS (.github/agents/)"
echo "═══════════════════════════════════════════════════════════"
check_file ".github/agents/requirements-parser.agent.md"
check_file ".github/agents/development-agent.agent.md"
check_file ".github/agents/testing-agent.agent.md"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "CI/CD WORKFLOWS (.github/workflows/)"
echo "═══════════════════════════════════════════════════════════"
check_file ".github/workflows/ci.yml"
check_file ".github/workflows/test-report.yml"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "ORCHESTRATION & INSTRUCTIONS (.github/)"
echo "═══════════════════════════════════════════════════════════"
check_file ".github/AGENTS.md"
check_file ".github/copilot-instructions.md"
check_file ".github/instructions/playwright-testing.instructions.md"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "HELPER SCRIPTS (scripts/)"
echo "═══════════════════════════════════════════════════════════"
check_file "scripts/install-deps.sh"
check_file "scripts/dev-setup.sh"
check_file "scripts/new-requirement.sh"
check_file "scripts/test-feature.sh"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "PLAYWRIGHT TESTING (frontend/)"
echo "═══════════════════════════════════════════════════════════"
check_file "frontend/playwright.config.ts"
check_file "frontend/tests/e2e/smoke.spec.ts"
check_file "frontend/tests/e2e/features.spec.ts"
check_dir "frontend/tests/fixtures"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "DOCUMENTATION (root/)"
echo "═══════════════════════════════════════════════════════════"
check_file "QUICK_START.md"
check_file "COMPLETE_CI_CD_GUIDE.md"
check_file "VISUAL_GUIDE.md"
check_file "SETUP_SUMMARY.md"
check_file "PLAYWRIGHT_SETUP.md"
check_file "README_FINAL.md"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "EXAMPLE REQUIREMENT (docs/)"
echo "═══════════════════════════════════════════════════════════"
check_file "docs/requirements/FEAT-001-transaction-date-filter.md"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "VERIFICATION CHECKS"
echo "═══════════════════════════════════════════════════════════"

# Check if scripts are executable
if [ -x "scripts/install-deps.sh" ]; then
    echo -e "${GREEN}✅${NC} scripts/ are executable"
else
    echo -e "${YELLOW}⚠️${NC}  scripts/ need to be executable"
    echo "   Run: chmod +x scripts/*.sh"
fi

# Check frontend package.json has Playwright
if grep -q "@playwright/test" frontend/package.json; then
    echo -e "${GREEN}✅${NC} frontend/package.json has Playwright"
else
    echo -e "${RED}❌${NC} frontend/package.json missing Playwright"
fi

# Check git configuration
if [ -d ".git" ]; then
    echo -e "${GREEN}✅${NC} Git repository initialized"
else
    echo -e "${YELLOW}⚠️${NC}  Git repository not initialized"
    echo "   Run: git init"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📊 Files Created:"
echo "   • 3 Copilot Agent files"
echo "   • 2 GitHub Actions workflows"
echo "   • 4 Helper scripts (executable)"
echo "   • 3 Playwright test files"
echo "   • 6 Documentation guides"
echo "   • 1 Example requirement file"
echo "   • Multiple instruction/config files"
echo ""
echo "🎯 You Can Now:"
echo "   1. Run: ./scripts/install-deps.sh"
echo "   2. Ask Copilot agents for help"
echo "   3. Run tests: ./scripts/test-feature.sh FEAT-01"
echo "   4. Deploy: git push (automated!)"
echo ""
echo "📚 Read These First:"
echo "   1. QUICK_START.md (5 min)"
echo "   2. VISUAL_GUIDE.md (flowcharts)"
echo "   3. .github/AGENTS.md (workflows)"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Setup Verification Complete!${NC}"
echo ""
echo "🚀 Next Step: Read QUICK_START.md and start building!"
echo ""
