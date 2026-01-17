# How to Re-Import the Fixed Workflow

**Issue:** The workflow in n8n UI shows disconnected agent nodes because it's using the OLD version with LangChain nodes.

**Solution:** Re-import the FIXED workflow that uses HTTP Request nodes instead.

---

## Step-by-Step Instructions

### Option A: Overwrite Existing Workflow (Recommended)

1. **Open n8n** in your browser (http://localhost:5678)

2. **Open the existing "WPI AI Content Factory PoC" workflow**

3. **Click the "..." menu** (top right corner)

4. **Select "Import from File"**

5. **Browse to:**
   ```
   c:\Hennadii Shvedko Documents\source code\Webakademy\new WPI\n8n writer\workflows\wpi-content-factory-workflow.json
   ```

6. **When prompted "Workflow already exists":**
   - Select **"Replace"** (overwrite the old version)
   - Click **"Import"**

7. **Verify the nodes are connected:**
   - You should see all nodes connected in a flow
   - The 5 agent nodes should be HTTP Request nodes (type: "HTTP Request")
   - No more disconnected LangChain nodes!

---

### Option B: Delete and Re-Import (Clean Slate)

1. **Open n8n** in your browser

2. **Open the existing "WPI AI Content Factory PoC" workflow**

3. **Click the "..." menu** → **"Delete"**
   - Confirm deletion

4. **Go back to workflow list** (click "Workflows" in sidebar)

5. **Click "+"** → **"Import from File"**

6. **Browse to:**
   ```
   c:\Hennadii Shvedko Documents\source code\Webakademy\new WPI\n8n writer\workflows\wpi-content-factory-workflow.json
   ```

7. **Click "Import"**

8. **Verify the workflow** is now properly connected

---

## What Changed

The fixed workflow now uses **HTTP Request nodes** instead of **LangChain Chat Model nodes**:

### Before (BROKEN - LangChain nodes)
```json
{
  "name": "🏗️ Architect Agent",
  "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",  ← WRONG! Sub-node type
  ...
}
```

### After (FIXED - HTTP Request nodes)
```json
{
  "name": "🏗️ Architect Agent",
  "type": "n8n-nodes-base.httpRequest",  ← CORRECT! Workflow node type
  "parameters": {
    "method": "POST",
    "url": "https://api.openai.com/v1/chat/completions",
    ...
  }
}
```

---

## After Re-Import

### Expected Workflow Structure

You should see a **connected flow** like this:

```
📥 Form → 🔧 Init → 🏗️ Architect → 📋 Parse → 📧 Send → ⏸️ Wait → 🔀 Approved?
                                                                      ↓ Yes
                                                          📑 Prepare Chapters
                                                                      ↓
                                                          🔁 Chapter Loop ←─────┐
                                                                      ↓         │
                                                          🔍 Researcher         │
                                                                      ↓         │
                                                          💾 Store Research     │
                                                                      ↓         │
                                                          ✍️ Writer             │
                                                                      ↓         │
                                                          📝 Extract Code       │
                                                                      ↓         │
                                                          🔀 Code Needed?       │
                                                            ↓ Yes    ↓ No      │
                                                         💻 Coder  ⏭️ Skip     │
                                                            ↓        ↓         │
                                                          🔗 Merge Code        │
                                                                      ↓         │
                                                          🔀 Merge              │
                                                                      ↓         │
                                                          🔍 Editor (QA)        │
                                                                      ↓         │
                                                          📊 Parse Result       │
                                                                      ↓         │
                                                          🔀 Quality OK?        │
                                                            ↓ Yes    ↓ No      │
                                                        (Loop)    (Revise) ────┘
                                                            ↓
                                                          📚 Compile Book
                                                            ↓
                                                 💾 Save MD + 💾 Save Exam + 📧 Notify
```

### All Agent Nodes Should Show:
- **Type:** HTTP Request (in the node header)
- **Connected:** Lines connecting to previous/next nodes
- **No red error dots** (credentials will need to be configured)

---

## Next Steps After Re-Import

1. ✅ **Verify all nodes are connected** (no floating disconnected nodes)

2. ⚙️ **Configure OpenAI Credentials:**
   - Go to Settings → Credentials
   - Create OpenAI API credential
   - Update all 5 HTTP Request agent nodes to use this credential

3. 📧 **Configure Email Nodes:**
   - Update email addresses in "📧 Send for Approval" and "📧 Notify Completion"
   - Add SMTP credentials

4. ✅ **Test the workflow:**
   - Run with 1 chapter
   - Verify execution

---

## Troubleshooting

### Issue: "Workflow already exists" prompt doesn't appear

**Solution:** The workflow might have a different name. Look for any workflow with "WPI" or "Content Factory" in the name and delete it first.

### Issue: After import, some nodes still disconnected

**Solution:**
1. Check if you imported the correct file (should be ~34KB)
2. Try Option B (delete and re-import)
3. Check browser console for errors (F12)

### Issue: "Node type not found" error

**Solution:**
1. Update n8n to latest version: `docker pull n8nio/n8n`
2. Restart n8n
3. Re-import workflow

---

## Verification Checklist

After re-import, verify:

- [ ] All 27 nodes are visible
- [ ] All nodes are connected (no floating nodes)
- [ ] 5 agent nodes are type "HTTP Request" (not LangChain)
- [ ] Workflow overview on left shows proper structure
- [ ] No red error rectangles around agent nodes
- [ ] Workflow name is "WPI AI Content Factory PoC"

Once all checked ✅, proceed to configure credentials!

---

**File:** `wpi-content-factory-workflow.json`
**Size:** ~34 KB
**Nodes:** 27
**Connections:** 30
**Status:** ✅ FIXED (uses HTTP Request nodes)
