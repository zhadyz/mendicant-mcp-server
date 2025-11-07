# OpenAI Setup (Optional)

> **Note:** As of Cycle 5, MENDICANT uses **Mnemosyne BGE-large embeddings by default** if Mnemosyne MCP is available. OpenAI is only used as a fallback if Mnemosyne is unavailable.

## Do You Need OpenAI?

**Quick Decision Guide:**

- ❌ **No** - If you have Mnemosyne MCP configured (recommended, free, local)
- ✅ **Yes** - If you want to use MENDICANT without Mnemosyne
- ✅ **Yes** - If you prefer OpenAI's ecosystem or need OpenAI-specific features
- ⚠️ **Maybe** - For production systems requiring 24/7 uptime (dual provider redundancy)

## Using Mnemosyne Instead (Recommended)

**If you have Mnemosyne MCP configured, you're already set!** MENDICANT will automatically detect and use it for embeddings.

**Advantages of Mnemosyne BGE-large:**
- **Free:** No API costs, no billing setup required
- **Private:** Local model, data never leaves your machine
- **High Quality:** BGE-large provides comparable quality to OpenAI (1024 dimensions)
- **Offline Capable:** Works without internet connection
- **No Rate Limits:** Process as many embeddings as your hardware allows
- **Semantic Search:** Built-in knowledge graph with semantic search capabilities

**Provider Priority:**
```
1. Mnemosyne BGE-large (free, local, 1024 dims) ← Default
2. OpenAI text-embedding-3-small (paid, cloud, 1536 dims) ← Fallback
3. Keyword matching (free, basic, ~70% accuracy) ← Last resort
```

**Initialization Logs:**
```bash
[EmbeddingService] Using Mnemosyne BGE-large (local, free, 1024 dims)
[SemanticMatchingService] Initialized with Mnemosyne provider
[IntelligentSelector] Semantic matching enabled (weight: 0.30)
```

## When to Use This Guide

**Continue reading if:**
- You don't have Mnemosyne MCP configured
- You want to use OpenAI as your primary provider
- You need to configure OpenAI as a fallback for redundancy
- Mnemosyne initialization failed and you need an alternative

**Otherwise:** You can skip this guide - MENDICANT is already optimized for your setup.

---

# OpenAI API Setup Guide

**Purpose:** Enable semantic agent matching with OpenAI embeddings (fallback provider)
**Model:** text-embedding-3-small (1536 dimensions)
**Cost:** ~$0.003/month for typical usage
**Optional:** Server works without API key (Mnemosyne or keyword fallback)

---

## Why OpenAI API?

**Semantic agent matching** uses OpenAI embeddings to understand query intent and agent expertise semantically, improving selection accuracy by 15-20% compared to keyword-only matching.

**Benefits:**
- **Better understanding:** "Fix OAuth bug" → understands authentication, security, debugging
- **Context awareness:** Matches similar concepts even with different words
- **Improved accuracy:** 85-90% vs 70% with keywords only
- **Cost-efficient:** ~$0.003/month with caching for typical usage

**Without API key:**
- Automatic fallback to Mnemosyne (if available) or keyword-based matching
- Still works, but lower accuracy (~70% with keyword fallback)
- Zero API costs
- Instant computation (no network latency)

---

## Getting an API Key

### Step 1: Create OpenAI Account

1. Visit https://platform.openai.com
2. Click "Sign up" (top right)
3. Create account with email or SSO
4. Verify email address

### Step 2: Set Up Billing

**Required for API access** (even for free tier):

1. Go to https://platform.openai.com/settings/organization/billing/overview
2. Click "Add payment method"
3. Enter credit card details
4. Set spending limits (optional but recommended)

**Recommended limits for Mendicant MCP:**
- **Daily limit:** $0.10/day (~300K tokens)
- **Monthly limit:** $3.00/month (~10M tokens)
- **Hard cap:** Enabled (prevents overages)

### Step 3: Create API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. **Name:** "Mendicant MCP Server"
4. **Permissions:** All (or just "Read" if available)
5. Click "Create"
6. **IMPORTANT:** Copy the key immediately (starts with `sk-`)
7. Store securely (you won't see it again)

**Key Format:**
```
sk-proj-...  (project-scoped key)
sk-...       (legacy format)
```

Both formats work. Project-scoped keys are recommended for better organization.

---

## Configuration

### Windows PowerShell

**Temporary (current session):**
```powershell
$env:OPENAI_API_KEY="sk-..."
```

**Permanent (user profile):**
```powershell
[System.Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "sk-...", "User")
```

**Verify:**
```powershell
echo $env:OPENAI_API_KEY
```

### Windows Command Prompt

**Temporary (current session):**
```cmd
set OPENAI_API_KEY=sk-...
```

**Permanent (requires reboot):**
```cmd
setx OPENAI_API_KEY "sk-..."
```

**Verify:**
```cmd
echo %OPENAI_API_KEY%
```

### Linux/macOS (Bash/Zsh)

**Temporary (current session):**
```bash
export OPENAI_API_KEY="sk-..."
```

**Permanent (add to shell profile):**
```bash
# Bash
echo 'export OPENAI_API_KEY="sk-..."' >> ~/.bashrc
source ~/.bashrc

# Zsh
echo 'export OPENAI_API_KEY="sk-..."' >> ~/.zshrc
source ~/.zshrc
```

**Verify:**
```bash
echo $OPENAI_API_KEY
```

### Docker / Container Environments

**Docker Compose:**
```yaml
services:
  mendicant:
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

**Kubernetes:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: openai-secret
type: Opaque
data:
  api-key: <base64-encoded-key>
```

### CI/CD Pipelines

**GitHub Actions:**
```yaml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

**GitLab CI:**
```yaml
variables:
  OPENAI_API_KEY: $OPENAI_API_KEY
```

---

## Verifying Setup

### Test 1: Environment Variable

```bash
echo $OPENAI_API_KEY
```

**Expected:** `sk-...` (your actual key)

**If empty:**
- Variable not set
- Shell profile not sourced
- Terminal not restarted (if using `setx`)

### Test 2: Server Initialization

**Start server:**
```bash
cd mendicant-mcp-server
npm run dev
```

**Check logs:**
```bash
tail -f /tmp/mendicant-debug.log | grep -i "embedding\|semantic"
```

**Expected (with Mnemosyne, no OpenAI key):**
```
[EmbeddingService] Using Mnemosyne BGE-large (local, free, 1024 dims)
[SemanticMatchingService] Initialized successfully with Mnemosyne
[IntelligentSelector] Semantic matching enabled (weight: 0.30)
```

**Expected (with OpenAI API key):**
```
[EmbeddingService] Mnemosyne initialization failed, trying OpenAI...
[EmbeddingService] Using OpenAI text-embedding-3-small (1536 dimensions)
[SemanticMatchingService] Initialized successfully with OpenAI
[IntelligentSelector] Semantic matching enabled (weight: 0.30)
```

**Expected (without API key - fallback mode):**
```
[EmbeddingService] No embedding provider available, using keyword fallback
[SemanticMatchingService] No embedding provider, using keyword-based matching
[IntelligentSelector] Semantic matching: keyword fallback (confidence: 0.5)
```

### Test 3: API Call

**Simple test:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Expected:** JSON list of available models (includes `text-embedding-3-small`)

**If error:**
- `401 Unauthorized`: Invalid API key
- `429 Too Many Requests`: Rate limit exceeded
- `Connection refused`: Network issue

### Test 4: Embedding Generation

**Use mendicant_plan with semantic query:**
```typescript
const plan = await mendicant_plan(
  "Fix authentication bug in OAuth flow"
);
```

**Check cache:**
```bash
ls -la .mendicant/cache/embeddings/
```

**Expected:** Cache files created (SHA256 hashes)

---

## Cost Management

### Understanding Costs

**Pricing (as of 2025-01-06):**
- **text-embedding-3-small:** $0.00013 per 1K tokens
- **text-embedding-3-large:** $0.00013 per 1K tokens (same price, higher dimensions)

**Token Estimation:**
- Average query: ~50 tokens
- Average agent description: ~100 tokens
- 1 agent selection: ~150 tokens (1 query + 1 agent)

### Monthly Cost Projections

| Usage Level | Selections/Month | API Calls | Cost (No Cache) | Cost (95% Cache) |
|-------------|------------------|-----------|-----------------|------------------|
| Personal | 1,000 | 2,000 | $0.026 | $0.003 |
| Team | 10,000 | 20,000 | $0.26 | $0.03 |
| Enterprise | 100,000 | 200,000 | $2.60 | $0.30 |

**Cache hit rates:**
- Day 1: ~20% (cold start)
- Week 1: ~80% (typical queries cached)
- Steady state: ~95% (mature cache)

### Setting Billing Limits

**Recommended limits:**

1. Go to https://platform.openai.com/settings/organization/limits
2. Set **Monthly budget:** $3.00
3. Enable **Email alerts** at 50%, 80%, 100%
4. Enable **Hard limit** (stops requests when exceeded)

**For Mendicant MCP:**
- $3/month supports ~23K agent selections (no cache)
- $3/month supports ~100K selections (with 95% cache)
- Typical team: ~10K selections/month = $0.03/month

### Monitoring Costs

**Dashboard:**
https://platform.openai.com/usage

**Check current spending:**
```bash
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**Monitor cache efficiency:**
```typescript
const stats = await intelligentSelector.getCacheStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);
console.log(`API calls saved: ${stats.hits} / ${stats.total}`);
```

**Expected steady state:**
```
Cache hit rate: 94.2%
API calls saved: 1,883 / 2,000
Estimated monthly cost: $0.03 (vs $0.26 without cache)
```

### Cost Optimization Tips

1. **Increase cache size:**
   ```json
   {
     "embeddings": {
       "cache": {
         "l1Size": 200,
         "l2TTL": 172800,
         "l3TTL": 15552000
       }
     }
   }
   ```

2. **Use keyword fallback for low-priority ops:**
   ```typescript
   // Skip semantic matching for simple queries
   if (isSimpleQuery(objective)) {
     return keywordBasedSelection(objective);
   }
   ```

3. **Batch similar queries:**
   ```typescript
   // Reuse query embedding for multiple agent comparisons
   const queryEmbedding = await getEmbedding(objective);
   const scores = await Promise.all(
     agents.map(agent => computeSimilarity(queryEmbedding, agent))
   );
   ```

4. **Monitor and adjust:**
   - Review usage weekly
   - Adjust cache TTLs based on hit rates
   - Consider disabling for non-production environments

---

## Troubleshooting

### Issue: "Invalid API Key"

**Error:**
```
Error: OpenAI API key invalid
401 Unauthorized
```

**Solutions:**
1. Verify key starts with `sk-`
2. Check for extra spaces/newlines: `echo "$OPENAI_API_KEY" | wc -c`
3. Test key manually: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`
4. Regenerate key at https://platform.openai.com/api-keys

### Issue: "Billing Required"

**Error:**
```
Error: You exceeded your current quota, please check your plan and billing details
429 Too Many Requests
```

**Solutions:**
1. Add payment method: https://platform.openai.com/settings/organization/billing/overview
2. Set billing limits: https://platform.openai.com/settings/organization/limits
3. Check current usage: https://platform.openai.com/usage
4. Enable Mnemosyne or keyword fallback in config

### Issue: "Rate Limit Exceeded"

**Error:**
```
Error: Rate limit reached for requests
429 Too Many Requests
```

**Solutions:**
1. Wait 60 seconds (rate limits reset per minute)
2. Reduce request frequency
3. Increase cache size to reduce API calls
4. Upgrade to higher tier plan (if needed)

### Issue: High API Costs

**Symptom:** Unexpected billing, high usage

**Diagnosis:**
```typescript
const stats = await intelligentSelector.getCacheStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);
```

**Solutions:**
1. **Low cache hit rate (<80%):**
   - Increase L1 cache size
   - Increase L2/L3 TTL
   - Check for cache clearing

2. **High query diversity:**
   - Consider keyword fallback for unique queries
   - Use query normalization (lowercase, trim)
   - Batch similar queries

3. **Development environment:**
   - Disable semantic matching in dev
   - Use keyword fallback in tests
   - Share cache across team members

### Issue: Semantic Matching Not Working

**Symptom:** All similarity scores are 0.5

**Diagnosis:**
```bash
echo $OPENAI_API_KEY
grep "Embedding" /tmp/mendicant-debug.log
```

**Solutions:**
1. Check if Mnemosyne is available and working
2. API key not set: `export OPENAI_API_KEY="sk-..."`
3. Server not restarted after setting key
4. Firewall blocking OpenAI API (check network)
5. API key expired/revoked (regenerate)

### Issue: Slow Response Times

**Symptom:** Agent selection taking >5 seconds

**Diagnosis:**
```typescript
console.time('agent-selection');
const plan = await mendicant_plan(objective);
console.timeEnd('agent-selection');
```

**Solutions:**
1. **Cold cache:** First query always slow (~500ms)
2. **Network latency:** Check OpenAI API latency
3. **Rate limiting:** Requests being throttled
4. **Large agent pool:** Reduce number of agents

**Optimization:**
```json
{
  "embeddings": {
    "cache": {
      "l1Size": 200,
      "preload": ["hollowed_eyes", "loveless", "the_architect"]
    }
  }
}
```

---

## Security Best Practices

### DO

✅ **Store API key in environment variables** (not in code)
✅ **Use project-scoped keys** (better organization)
✅ **Set billing limits** (prevent unexpected costs)
✅ **Rotate keys periodically** (every 90 days recommended)
✅ **Use separate keys per environment** (dev/staging/prod)
✅ **Enable email alerts** (50%, 80%, 100% thresholds)
✅ **Monitor usage regularly** (weekly reviews)

### DON'T

❌ **Don't commit API keys to git** (use .env files with .gitignore)
❌ **Don't share keys in chat/email** (use secret managers)
❌ **Don't use personal keys for production** (use organization keys)
❌ **Don't disable rate limits** (protect against runaway costs)
❌ **Don't skip billing setup** (required for API access)
❌ **Don't use keys in client-side code** (server-side only)

### Key Storage Recommendations

**Development:**
- `.env` file (add to .gitignore)
- Shell profile (~/.bashrc, ~/.zshrc)
- System environment variables

**Production:**
- AWS Secrets Manager
- Azure Key Vault
- GCP Secret Manager
- HashiCorp Vault
- Kubernetes Secrets

**Never:**
- Hardcoded in source code
- Committed to version control
- Stored in plaintext config files
- Shared via insecure channels

---

## Alternative: Mnemosyne or Keyword Fallback

If you prefer not to use OpenAI API (cost, privacy, network constraints), **Mnemosyne BGE-large** (recommended) or **keyword fallback mode** are production-ready and fully supported.

### Option 1: Mnemosyne BGE-large (Recommended)

**How to enable:**
1. Ensure Mnemosyne MCP is configured in your Claude Code
2. Don't set `OPENAI_API_KEY` environment variable
3. MENDICANT will automatically detect and use Mnemosyne

**What you get:**
- ✅ Zero API costs
- ✅ Full privacy (local processing)
- ✅ Offline capable
- ✅ High quality (BGE-large, comparable to OpenAI)
- ✅ 85-90% accuracy (semantic embeddings)
- ✅ Knowledge graph integration
- ✅ No rate limits

### Option 2: Keyword Fallback

**How to enable:**
1. Don't set `OPENAI_API_KEY` environment variable
2. Ensure Mnemosyne is not available
3. Or set `semanticMatching.enabled: false` in config

**What you get:**
- ✅ Zero API costs
- ✅ Instant computation (no network latency)
- ✅ Full privacy (no external API calls)
- ✅ Works offline
- ✅ 70% accuracy (vs 85-90% with embeddings)

**How it works:**
- TF-IDF keyword extraction
- Cosine similarity on keyword vectors
- Confidence: 0.5 (vs 0.9 with embeddings)

**When to use:**
- Budget constraints
- Privacy requirements
- Offline environments
- Testing/development
- Low-traffic projects

---

## Getting Help

**OpenAI Support:**
- Help Center: https://help.openai.com
- API Status: https://status.openai.com
- Community Forum: https://community.openai.com

**Mendicant MCP Support:**
- GitHub Issues: https://github.com/zhadyz/mendicant-mcp-server/issues
- Documentation: [CYCLE5_FEATURES.md](./CYCLE5_FEATURES.md)
- Migration Guide: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

## Summary

**Quick Setup (5 minutes):**
1. Get API key: https://platform.openai.com/api-keys
2. Set environment variable: `export OPENAI_API_KEY="sk-..."`
3. Restart server: `npm run dev`
4. Verify: Check logs for "Using OpenAI" or "Using Mnemosyne"

**Expected costs:**
- Personal: ~$0.003/month
- Team: ~$0.03/month
- Enterprise: ~$0.30/month

**Default:** Uses Mnemosyne BGE-large if available (free, local, high-quality)
**Fallback:** OpenAI if API key provided, otherwise keyword-based (70% accuracy)

---

**Guide Version:** 2.0
**Last Updated:** 2025-11-06
**Default Provider:** Mnemosyne BGE-large (free, local, 1024 dims)
**Fallback Provider:** OpenAI text-embedding-3-small (paid, cloud, 1536 dims)
**Pricing:** $0.00013 per 1K tokens (OpenAI only)
