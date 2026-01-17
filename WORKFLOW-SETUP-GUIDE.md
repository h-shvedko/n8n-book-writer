# WPI Content Factory Workflow - Setup Guide

**Last Updated:** 2026-01-16
**Workflow Version:** 1.0 (Fixed)

This guide will help you import and configure the WPI AI Content Factory workflow in n8n.

---

## ✅ What Was Fixed

The workflow has been updated with the following fixes:

### Critical Fixes Applied
1. ✅ **Fixed OpenAI node types** - Changed from invalid `@n8n/n8n-nodes-langchain.openAi` to correct `@n8n/n8n-nodes-langchain.lmChatOpenAi`
2. ✅ **Fixed Form Trigger response mode** - Changed from `responseNode` to `onReceived` (no separate response node needed)
3. ✅ **Fixed expression syntax** - Corrected n8n expression syntax in Set nodes
4. ✅ **Added Merge node mode** - Set to `mergeByPosition`
5. ✅ **Fixed file paths** - Added `/tmp/wpi-books/` directory prefix for output files

---

## 📋 Prerequisites

Before importing the workflow, ensure you have:

- [ ] n8n installed and running (version 1.0+ recommended)
- [ ] OpenAI API account with API key
- [ ] Email account for notifications (SMTP credentials)
- [ ] Access to create directories on your n8n server

---

## 🚀 Step-by-Step Setup

### Step 1: Create Output Directory

On your n8n server, create the output directory:

```bash
mkdir -p /tmp/wpi-books
chmod 755 /tmp/wpi-books
```

**Note:** You can change this path later in the workflow settings if needed.

---

### Step 2: Import Workflow

1. Open n8n in your browser
2. Click **"+"** → **"Import from File"**
3. Select `workflows/wpi-content-factory-workflow.json`
4. Click **"Import"**

The workflow will be imported with 29 nodes.

---

### Step 3: Configure OpenAI Credentials

You need to set up OpenAI credentials for the 5 AI agent nodes:

1. In n8n, go to **Settings** → **Credentials**
2. Click **"+ Add Credential"**
3. Search for **"OpenAI"**
4. Enter your **OpenAI API Key**
5. Click **"Create"**
6. **Copy the Credential ID** (you'll need it next)

Now update the workflow nodes:

**Option A: Via n8n UI (Recommended)**
1. Open the workflow
2. Click on each AI agent node (5 nodes):
   - 🏗️ Architect Agent
   - 🔍 Researcher Agent
   - ✍️ Writer Agent
   - 💻 Coder Agent
   - 🔍 Editor Agent (QA)
3. In each node, select your OpenAI credential from the dropdown
4. Click **"Save"**

**Option B: Via JSON (Advanced)**
1. Export the workflow JSON
2. Find and replace ALL instances of:
   ```json
   "id": "OPENAI_CREDENTIALS_ID"
   ```
   With:
   ```json
   "id": "YOUR_ACTUAL_CREDENTIAL_ID"
   ```
3. Re-import the workflow

---

### Step 4: Configure Email Notifications

The workflow sends email notifications at two points:
- When blueprint is ready for approval
- When book compilation is complete

**Setup SMTP Credentials:**

1. In n8n, go to **Settings** → **Credentials**
2. Click **"+ Add Credential"**
3. Search for **"SMTP"** or **"Email Send"**
4. Enter your email server details:
   - **Host:** `smtp.gmail.com` (or your provider)
   - **Port:** `587` (or `465` for SSL)
   - **User:** `your-email@example.com`
   - **Password:** Your email password or app password
5. Click **"Create"**

**Update Email Nodes:**

1. Open the workflow
2. Click on **"📧 Send for Approval"** node
3. Select your email credential
4. Update email addresses:
   - **From Email:** `content-factory@wpi.org` → Your sender email
   - **To Email:** `expert@wpi.org` → Blueprint reviewer email
5. Click **"Save"**

6. Repeat for **"📧 Notify Completion"** node:
   - **To Email:** `team@wpi.org` → Team notification email

---

### Step 5: Test the Workflow

Before running a full book generation:

1. **Activate the workflow** (toggle in top right)
2. Get the **Form URL**:
   - Click on **"📥 Book Request Form"** node
   - Copy the **Webhook URL** (something like `https://your-n8n.com/form/abc123`)
3. Open the form URL in your browser
4. Fill in **minimal test data**:
   - **Book Slot ID:** `test-01`
   - **Product Definition:** `A short test book about JavaScript basics`
   - **Target Audience:** `Absolute Beginners`
   - **Focus Areas:** `Variables, Functions`
   - **Number of Chapters:** `1` (for testing!)
5. Submit the form
6. Monitor execution in n8n

**Expected Flow:**
1. Form submitted → BookState initialized
2. Architect Agent generates blueprint (1 chapter)
3. Email sent for approval
4. Click approval link in email
5. Researcher → Writer → Editor process chapter
6. Book compiled and saved to `/tmp/wpi-books/test-01.md`
7. Completion email sent

---

## ⚙️ Configuration Options

### Adjust Output Directory

To change where files are saved:

1. Open workflow
2. Click on **"💾 Save Markdown"** node
3. Change `fileName` parameter from:
   ```
   =/tmp/wpi-books/{{ $json.book_id }}.md
   ```
   To your desired path:
   ```
   =/your/custom/path/{{ $json.book_id }}.md
   ```
4. Repeat for **"💾 Save Exam Questions"** node
5. Click **"Save"**

### Adjust AI Model Settings

Each AI agent node has configurable parameters:

**Architect Agent:**
- Model: `gpt-4o`
- Temperature: `0.3` (focused, deterministic)
- Max Tokens: `4000`

**Researcher Agent:**
- Model: `gpt-4o-mini` (cost-effective)
- Temperature: `0.5` (balanced)
- Max Tokens: `2000`

**Writer Agent:**
- Model: `gpt-4o`
- Temperature: `0.7` (more creative)
- Max Tokens: `6000` (may need more for long chapters)

**Coder Agent:**
- Model: `gpt-4o`
- Temperature: `0.2` (precise)
- Max Tokens: `4000`

**Editor Agent:**
- Model: `gpt-4o`
- Temperature: `0.3` (focused)
- Max Tokens: `3000`

To adjust:
1. Click on the AI agent node
2. Expand **"Options"**
3. Change `temperature` or `maxTokens`
4. Click **"Save"**

### Adjust Quality Threshold

By default, chapters need a score of 90/100 to pass. To change:

1. Open **"🔍 Editor Agent (QA)"** node
2. Find this line in the system prompt:
   ```
   Wenn score < 90, setze "approved": false
   ```
3. Change `90` to your desired threshold (e.g., `85`, `95`)
4. Click **"Save"**

### Adjust Max Revisions

By default, chapters are revised up to 3 times. To change:

1. Open **"🔀 Max Revisions?"** node (IF node)
2. Change the condition `rightValue` from `3` to your desired number
3. Click **"Save"**

---

## 💰 Cost Estimation

Approximate costs per book chapter (using OpenAI GPT-4o):

- **Architect:** ~$0.10 (one-time per book)
- **Researcher:** ~$0.05 per chapter
- **Writer:** ~$0.20 per chapter (most expensive)
- **Coder:** ~$0.10 per chapter (if code needed)
- **Editor:** ~$0.08 per chapter

**Total per chapter:** ~$0.43
**Total for 10-chapter book:** ~$4.40

**Ways to reduce costs:**
1. Use `gpt-4o-mini` for all agents (save ~70%)
2. Reduce token limits
3. Skip code generation if not needed
4. Lower quality threshold to reduce revisions

---

## 🔧 Troubleshooting

### Issue: "Node type not found"

**Symptom:** Error loading workflow, mentions `@n8n/n8n-nodes-langchain.openAi`

**Solution:** This should be fixed in the updated workflow. If you still see it:
1. Update n8n to latest version
2. Re-import the workflow from this fixed version

---

### Issue: "OpenAI API error"

**Symptom:** AI agent nodes fail with authentication errors

**Solution:**
1. Check OpenAI API key is valid
2. Check you have sufficient credits
3. Verify credential is selected in each AI node

---

### Issue: "Email not sending"

**Symptom:** Workflow runs but no emails received

**Solution:**
1. Check email credential is configured
2. Verify SMTP settings (host, port, auth)
3. Check spam folder
4. Test email credentials with n8n's "Test" button

---

### Issue: "Files not saved"

**Symptom:** Workflow completes but no output files

**Solution:**
1. Check `/tmp/wpi-books/` directory exists
2. Check n8n has write permissions
3. Look in n8n logs for file system errors
4. Try using absolute path instead of `/tmp/`

---

### Issue: "Expression evaluation error"

**Symptom:** Nodes fail with "Cannot read property" errors

**Solution:**
1. Check that previous nodes completed successfully
2. Verify node references use IDs, not emoji names
3. Check expression syntax (should use `={{ ... }}`)

---

## 📊 Monitoring & Logs

### View Execution History

1. In n8n, go to **"Executions"** tab
2. Click on an execution to see:
   - Which nodes succeeded/failed
   - Input/output data for each node
   - Execution time
   - Error messages

### Monitor Costs

Track OpenAI token usage:
1. Check execution output from AI nodes
2. Look for `usage` field in responses
3. Calculate: `(prompt_tokens + completion_tokens) × price_per_token`

### Add Logging

To log workflow progress:
1. Add **"Function"** nodes after key steps
2. Use `console.log()` to output data
3. Check n8n server logs

---

## 🎯 Best Practices

### Before Production Use

1. ✅ Test with 1-chapter books first
2. ✅ Review generated content quality
3. ✅ Iterate on prompts based on output
4. ✅ Set up error handling (Error Trigger workflow)
5. ✅ Configure proper output directory
6. ✅ Set up backup system for generated content

### For Production

1. 📌 Use environment variables for credentials
2. 📌 Set up monitoring and alerts
3. 📌 Version control your workflow JSON
4. 📌 Document any custom modifications
5. 📌 Create backup workflow for testing
6. 📌 Set up proper error notifications

### Cost Management

1. 💰 Start with smaller chapters to test
2. 💰 Use `gpt-4o-mini` where possible
3. 💰 Monitor token usage per execution
4. 💰 Set OpenAI usage limits/alerts
5. 💰 Consider caching research results

---

## 📚 Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [OpenAI API Pricing](https://openai.com/api/pricing/)
- [n8n LangChain Nodes](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.langchain/)
- [Workflow Validation Report](workflow-validation-report.md)
- [Project README](README.md)

---

## 🆘 Getting Help

If you encounter issues:

1. Check [workflow-validation-report.md](workflow-validation-report.md) for common issues
2. Review n8n execution logs
3. Check OpenAI API status
4. Consult [TODO.md](TODO.md) for known limitations

---

## ✅ Setup Checklist

Use this checklist to ensure everything is configured:

- [ ] n8n is running and accessible
- [ ] Output directory `/tmp/wpi-books/` created
- [ ] OpenAI credentials created in n8n
- [ ] All 5 AI agent nodes have OpenAI credentials assigned
- [ ] Email SMTP credentials created in n8n
- [ ] Email Send nodes have credentials assigned
- [ ] Email addresses updated (from/to)
- [ ] Workflow imported successfully
- [ ] Workflow activated
- [ ] Form URL tested and accessible
- [ ] Test run with 1 chapter completed successfully
- [ ] Output files verified in directory
- [ ] Email notifications received

Once all items are checked, you're ready to use the workflow for production! 🎉

---

**Next Steps:**
1. Run a test with 1 chapter
2. Review the generated content
3. Adjust prompts if needed
4. Scale up to full book generation

Good luck with your AI Content Factory! 📚🤖
