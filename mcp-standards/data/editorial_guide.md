# WPI Editorial Guide v2.9

## Purpose

This guide defines the standards for creating educational content at Web Professional Institute (WPI). All content must align with ISO 17024 certification requirements while maintaining WPI's distinctive tone and quality standards.

---

## WPI Tone of Voice

### Core Principles

1. **Professional-Instructive**
   - Authoritative yet accessible
   - Technical precision without jargon overload
   - Respect for the reader's intelligence

2. **Zero Fluff Rule**
   - Every sentence must carry information
   - No filler words or redundant explanations
   - Maximum competence density

3. **Pragmatic Focus**
   - Real-world examples over theoretical concepts
   - "How" and "Why" before "What"
   - Production-ready solutions, not toy examples

### Language Guidelines

#### German Technical Writing

- **Avoid "Du" or "Sie" in technical instructions**
  - ❌ "Du solltest die Konfiguration prüfen"
  - ✅ "Prüfen Sie die Konfiguration" (imperative)
  - ✅ "Die Konfiguration muss geprüft werden" (passive voice)

- **Use Active Voice When Possible**
  - ❌ "Der Server wurde von uns konfiguriert"
  - ✅ "Der Architect konfiguriert den Server"

- **Technical Terms in English**
  - Keep technical terms in English when commonly used
  - Example: "Deployment", "Callback", "Framework"
  - Provide German translation in parentheses on first use if needed

---

## Content Structure Template

### Chapter Structure (Standard)

```markdown
# [Chapter Number]. [Chapter Title]

## Einleitung (1 paragraph)
- Why this topic matters
- Real-world context
- What you'll learn

## Konzepte (2-3 pages)
- Fundamental concepts explained clearly
- Analogies from real-world scenarios
- Architecture diagrams (when applicable)

## Praxis (3-4 pages)
- Code examples with explanations
- Step-by-step implementation
- Edge cases and error handling
- Best practices

## Best Practices (1 page)
- Dos and Don'ts
- Common pitfalls
- Production considerations

## Zusammenfassung (1 paragraph)
- Key takeaways (3-5 bullet points)
- Connection to next chapter

## Lernziel-Check (Checkboxen)
- [ ] Self-assessment checklist aligned with ISO 17024 learning objectives

## Übung (1 page)
- Practical hands-on task
- Clear acceptance criteria
- Estimated time: 30-60 minutes
```

---

## Code Examples Standards

### The Tangibility Mandate

**Every technical topic MUST include a complete, syntactically correct code example.**

No placeholders like `// Your code here` or `/* Implementation details */`.

### Code Quality Requirements

1. **Modern Syntax**
   - JavaScript: ES6+ (const/let, arrow functions, template literals)
   - HTML: HTML5 semantic elements
   - CSS: Modern layout techniques (Grid, Flexbox)

2. **Production-Ready**
   - Error handling included
   - Edge cases considered
   - Comments in German (for explanation)
   - Comments in English for technical terms

3. **Code Structure**
```javascript
/**
 * [Brief description in German]
 *
 * @param {Type} paramName - Parameter description
 * @returns {Type} Return value description
 */
const functionName = (paramName) => {
  // Edge case handling
  if (!paramName) {
    throw new Error('paramName is required');
  }

  // Main logic with comments
  const result = doSomething(paramName);

  // Return with context
  return result;
};
```

### Code Validation

All code examples MUST:
- Be syntactically correct (pass ESLint for JS/TS)
- Run without errors
- Include all necessary imports/dependencies
- Handle common edge cases

---

## ISO 17024 Alignment

### Learning Objectives Format

Each learning objective must follow this structure:

```
[LO-XXX] [Bloom Level]: [Action Verb] [Subject] [Context]
```

**Example:**
```
LO-015 (Apply): Implement responsive layouts using CSS Grid in production environments
```

### Bloom's Taxonomy Levels

1. **Remember** - Recall facts, terms, concepts
2. **Understand** - Explain ideas, interpret information
3. **Apply** - Use knowledge in new situations
4. **Analyze** - Break down information, find patterns
5. **Evaluate** - Justify decisions, critique approaches
6. **Create** - Design, build, develop new solutions

### Assessment Alignment

Every learning objective must be:
- **Measurable** - Clear success criteria
- **Testable** - Can be verified through exam questions
- **Relevant** - Aligned with job market requirements
- **Time-bound** - Can be achieved within chapter scope

---

## Common Analogies & Metaphors

Use these proven analogies for complex concepts:

### Programming Concepts

- **Callbacks**: "Like leaving your phone number at a restaurant so they can call you when your table is ready"
- **Promises**: "Like a receipt you get when ordering food - it's not the food itself, but a guarantee you'll get it"
- **Async/Await**: "Like checking in online for a flight - you submit your request and wait for confirmation"
- **Closures**: "Like a backpack a function carries with it, containing all the variables it needs"

### Architecture Concepts

- **MVC Pattern**: "Like a restaurant - Kitchen (Model), Waiter (Controller), Menu (View)"
- **Microservices**: "Like specialized shops in a shopping mall vs. a department store"
- **Event-Driven Architecture**: "Like a notification system - you subscribe to events you care about"

---

## Quality Checklist

Before submitting content, verify:

### Content Quality
- [ ] All learning objectives are addressed
- [ ] Real-world examples are included
- [ ] Code examples are complete and tested
- [ ] No filler words or redundant explanations
- [ ] Tone is Professional-Instructive
- [ ] German is grammatically correct
- [ ] Technical terms are used correctly

### ISO 17024 Compliance
- [ ] Learning objectives follow Bloom's Taxonomy
- [ ] Assessment criteria are clear
- [ ] Content is measurable and verifiable
- [ ] Time allocation is realistic
- [ ] Prerequisites are stated

### Technical Accuracy
- [ ] Code compiles/runs without errors
- [ ] Best practices are followed
- [ ] Security considerations are mentioned
- [ ] Performance implications are discussed
- [ ] Browser/environment compatibility is noted

---

## Revision Process

### Self-Review (Author)
1. Read content aloud - does it sound natural?
2. Test all code examples - do they work?
3. Check learning objectives - are they all covered?
4. Verify tone - is it Professional-Instructive?

### Peer Review (Technical Expert)
1. Technical accuracy verification
2. Code quality assessment
3. Real-world applicability check

### Editorial Review (Editor)
1. ISO 17024 compliance check
2. Tone and style consistency
3. Grammar and formatting

### Final Approval (Quality Gate)
- Minimum quality score: 85/100
- All ISO requirements met
- Code validated and tested

---

## Example Implementations

### Good Example (Meets Standards)

```markdown
## Asynchrone Programmierung mit Promises

Promises lösen das „Callback Hell"-Problem durch eine elegantere Syntax.
Ein Promise repräsentiert das zukünftige Ergebnis einer asynchronen Operation.

### Grundstruktur

```javascript
/**
 * Lädt Benutzerdaten von einer API
 *
 * @param {string} userId - Die ID des Benutzers
 * @returns {Promise<User>} Promise mit Benutzerobjekt
 */
const fetchUser = (userId) => {
  return fetch(`/api/users/${userId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .catch(error => {
      console.error('Fehler beim Laden:', error);
      throw error;
    });
};

// Usage
fetchUser('123')
  .then(user => console.log('User:', user))
  .catch(error => console.error('Fehler:', error));
```

**Mechanik:** Die Fetch API gibt ein Promise zurück. Mit `.then()` registrieren
wir einen Callback für den Erfolgsfall, mit `.catch()` für Fehler.

**Impact:** Promises ermöglichen eine flache, lesbare Asynchronität. In
Production-Systemen ist das Error Handling kritisch - jedes Promise sollte
einen `.catch()` Block haben.
```
```

### Bad Example (Violates Standards)

```markdown
## Promises

Promises sind cool! Du kannst sie verwenden, um asynchrone Sachen zu machen.

```javascript
// Hier kommt dein Code hin
function doSomething() {
  // TODO: Implementierung
}
```

Sie machen dein Leben einfacher!
```

**Problems:**
- ❌ Informal tone ("cool", "Du")
- ❌ Vague explanation
- ❌ Placeholder code
- ❌ No practical context
- ❌ Filler words ("asynchrone Sachen")

---

## Contact & Support

For questions about this guide:
- Editorial Team: editorial@wpi.org
- Technical Questions: tech-support@wpi.org
- ISO Compliance: compliance@wpi.org

---

**Version:** 2.9
**Last Updated:** January 2026
**Next Review:** March 2026
