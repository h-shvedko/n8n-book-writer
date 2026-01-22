# 1. Moderne JavaScript-Entwicklung mit ES6+

> **ISO 17024 Alignment:** Domain 1.2 - Modern JavaScript Fundamentals
> **Bloom Level:** Apply, Analyze
> **Estimated Time:** 4-5 hours

---

## Einleitung

JavaScript hat sich von einer einfachen Scripting-Sprache zur Grundlage moderner Webentwicklung entwickelt. Mit ES6+ (ECMAScript 2015 und neuer) wurde die Sprache um fundamentale Features erweitert, die Production-Code lesbarer, wartbarer und sicherer machen.

**Warum ES6+ entscheidend ist:** Unternehmen erwarten heute von Entwicklern, dass sie moderne Syntax beherrschen. Legacy-Code mit `var` und Callback-basierten Patterns wird zunehmend durch deklarative, funktionale Ansätze ersetzt. Die Beherrschung von `const`/`let`, Arrow Functions, Destructuring und Promises ist keine "nice to have"-Skill mehr, sondern Mindestanforderung.

In diesem Kapitel lernen Sie die wichtigsten ES6+-Features kennen und wenden sie in praxisnahen Szenarien an.

---

## Konzepte

### 1. Block-Scoped Variables: `const` und `let`

Die Keyword `var` hatte ein fundamentales Problem: Function Scoping führte zu unerwarteten Bugs. ES6 führte Block Scoping ein.

**Die Regel:**
- **`const`**: Verwenden für Werte, die sich nicht ändern (Standardwahl)
- **`let`**: Verwenden für Werte, die sich ändern müssen
- **`var`**: NIE verwenden (Legacy-Code)

**Warum das wichtig ist:**

```javascript
// Problem mit var (function-scoped)
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3 (nicht 0, 1, 2!)

// Lösung mit let (block-scoped)
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 100);
}
// Output: 0, 1, 2 (wie erwartet)
```

**Impact:** Block Scoping verhindert häufige Bugs in Loops, Callbacks und Closures. In Production-Code ist das ein Sicherheits- und Wartbarkeits-Feature.

### 2. Arrow Functions

Arrow Functions sind mehr als nur syntaktischer Zucker - sie ändern fundamental das Verhalten von `this`.

**Klassische Function vs. Arrow Function:**

```javascript
// Klassische Function
function multiply(a, b) {
  return a * b;
}

// Arrow Function
const multiply = (a, b) => a * b;
```

**Der kritische Unterschied - `this` Binding:**

```javascript
const counter = {
  count: 0,

  // Klassische Function: eigenes 'this'
  incrementWrong: function() {
    setTimeout(function() {
      this.count++; // 'this' ist undefined oder window!
      console.log(this.count);
    }, 100);
  },

  // Arrow Function: lexikalisches 'this'
  incrementCorrect: function() {
    setTimeout(() => {
      this.count++; // 'this' referenziert das counter-Objekt
      console.log(this.count);
    }, 100);
  }
};
```

**Impact:** Arrow Functions eliminieren das `.bind(this)`-Pattern und machen Event-Handler und Callbacks deutlich lesbarer.

### 3. Template Literals

String-Konkatenation mit `+` ist fehleranfällig und schlecht lesbar. Template Literals lösen das Problem elegant.

```javascript
// Alt: String-Konkatenation
const name = 'Anna';
const age = 28;
const message = 'Hallo, ich bin ' + name + ' und ' + age + ' Jahre alt.';

// Neu: Template Literal
const message = `Hallo, ich bin ${name} und ${age} Jahre alt.`;
```

**Mehrzeilige Strings:**

```javascript
const html = `
  <div class="user-card">
    <h2>${name}</h2>
    <p>Alter: ${age}</p>
  </div>
`;
```

**Impact:** Template Literals reduzieren Fehlerquellen bei String-Operationen und machen dynamische HTML-Generierung lesbar.

### 4. Destructuring

Destructuring extrahiert Werte aus Arrays oder Objekten in Variablen.

```javascript
// Object Destructuring
const user = {
  name: 'Max Mustermann',
  email: 'max@example.com',
  role: 'admin'
};

const { name, email } = user;
console.log(name); // 'Max Mustermann'

// Array Destructuring
const coordinates = [48.1351, 11.5820]; // München
const [lat, lon] = coordinates;

// Mit Default Values
const { theme = 'light' } = user; // 'light', da 'theme' nicht existiert
```

**Impact:** Destructuring macht API-Responses und Function-Parameter deutlich lesbarer. Besonders wichtig bei React Props und Redux State.

### 5. Spread Operator

Der Spread Operator `...` erweitert Arrays oder Objekte.

```javascript
// Array Spread
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2]; // [1, 2, 3, 4, 5, 6]

// Object Spread (Immutability Pattern)
const originalState = { count: 0, theme: 'dark' };
const newState = { ...originalState, count: 1 };
// originalState bleibt unverändert!
```

**Impact:** Spread Operator ist der Grundstein für Immutability Patterns in React/Redux. Verhindert ungewollte Seiteneffekte.

---

## Praxis

### Szenario: User Management System

Implementieren Sie ein einfaches User-Management-System mit allen gelernten ES6+-Features.

```javascript
/**
 * User Management Class mit ES6+ Features
 *
 * Demonstriert: const/let, Arrow Functions, Template Literals,
 * Destructuring, Spread Operator, Default Parameters
 */

class UserManager {
  constructor() {
    // const für unveränderliche Referenz (Array-Inhalt kann sich ändern)
    this.users = [];
  }

  /**
   * Fügt einen neuen User hinzu
   *
   * @param {Object} userData - User-Daten
   * @returns {Object} Der erstellte User
   */
  addUser(userData) {
    const { name, email, role = 'user' } = userData;

    // Validierung mit frühem Return (Guard Clause)
    if (!name || !email) {
      throw new Error('Name und Email sind erforderlich');
    }

    // Email-Validierung mit Template Literal
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      throw new Error(`Ungültige Email: ${email}`);
    }

    // User-Objekt mit Spread Operator erstellen
    const newUser = {
      id: Date.now(),
      ...userData,
      role,
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    return newUser;
  }

  /**
   * Findet User nach Rolle
   *
   * @param {string} role - Die zu suchende Rolle
   * @returns {Array} Gefilterte User-Liste
   */
  findByRole(role) {
    // Arrow Function in filter (lexikalisches 'this')
    return this.users.filter(user => user.role === role);
  }

  /**
   * Aktualisiert User-Daten (Immutable Pattern)
   *
   * @param {number} userId - ID des zu aktualisierenden Users
   * @param {Object} updates - Zu aktualisierende Felder
   * @returns {Object|null} Aktualisierter User oder null
   */
  updateUser(userId, updates) {
    const userIndex = this.users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return null;
    }

    // Immutable Update mit Spread Operator
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return this.users[userIndex];
  }

  /**
   * Generiert User-Report als String
   *
   * @returns {string} Formatierter Report
   */
  generateReport() {
    const totalUsers = this.users.length;
    const adminCount = this.findByRole('admin').length;
    const userCount = this.findByRole('user').length;

    // Template Literal für mehrzeiligen String
    return `
=== USER MANAGEMENT REPORT ===
Total Users: ${totalUsers}
Admins: ${adminCount}
Regular Users: ${userCount}

User List:
${this.users.map(({ id, name, email, role }) =>
  `[${role.toUpperCase()}] ${name} (${email})`
).join('\n')}
===============================
    `.trim();
  }

  /**
   * Exportiert User-Daten als JSON
   *
   * @param {Array<string>} fields - Zu exportierende Felder
   * @returns {string} JSON-String
   */
  exportUsers(fields = ['id', 'name', 'email', 'role']) {
    // Destructuring in map
    const exportData = this.users.map(user => {
      const filtered = {};
      fields.forEach(field => {
        if (user[field] !== undefined) {
          filtered[field] = user[field];
        }
      });
      return filtered;
    });

    return JSON.stringify(exportData, null, 2);
  }
}

// ===== USAGE EXAMPLES =====

const manager = new UserManager();

// Beispiel 1: User hinzufügen
try {
  const admin = manager.addUser({
    name: 'Alice Schmidt',
    email: 'alice@example.com',
    role: 'admin'
  });
  console.log('Admin erstellt:', admin);
} catch (error) {
  console.error('Fehler:', error.message);
}

// Beispiel 2: User mit Default-Rolle
manager.addUser({
  name: 'Bob Müller',
  email: 'bob@example.com'
  // role wird automatisch 'user'
});

// Beispiel 3: User aktualisieren
const updated = manager.updateUser(admin.id, {
  email: 'alice.schmidt@example.com'
});
console.log('Aktualisiert:', updated);

// Beispiel 4: Report generieren
console.log(manager.generateReport());

// Beispiel 5: Export mit ausgewählten Feldern
const jsonExport = manager.exportUsers(['name', 'email']);
console.log('Export:\n', jsonExport);
```

**Mechanik:**

- **Class**: Strukturiert den Code in wiederverwendbare Komponenten
- **Destructuring**: Extrahiert nur benötigte Felder (z.B. `{ name, email, role = 'user' }`)
- **Spread Operator**: Immutable Updates ohne Seiteneffekte
- **Arrow Functions**: Callbacks mit korrektem `this`-Binding
- **Template Literals**: Lesbare String-Formatierung

**Impact:**

Dieser Code demonstriert Production-Ready Patterns:
- **Immutability**: State-Changes sind nachvollziehbar
- **Error Handling**: Frühe Validierung mit Guard Clauses
- **Maintainability**: Klare Separation of Concerns
- **Type Safety**: JSDoc-Kommentare für IDE-Support

---

## Best Practices

### Dos

✅ **Immer `const` als Default verwenden**
```javascript
const API_URL = 'https://api.example.com';
const users = [];
```

✅ **Arrow Functions für Callbacks**
```javascript
users.filter(u => u.active).map(u => u.name);
```

✅ **Destructuring für Objekte mit vielen Properties**
```javascript
const { id, name, email, role } = user;
```

✅ **Template Literals für String-Interpolation**
```javascript
console.log(`User ${name} logged in`);
```

✅ **Spread Operator für Immutable Updates**
```javascript
const newState = { ...oldState, updated: true };
```

### Don'ts

❌ **Niemals `var` verwenden**
```javascript
// WRONG
var x = 10;

// CORRECT
const x = 10;
```

❌ **Keine klassischen Functions für Callbacks**
```javascript
// WRONG
setTimeout(function() { console.log(this); }, 100);

// CORRECT
setTimeout(() => { console.log(this); }, 100);
```

❌ **String-Konkatenation mit `+`**
```javascript
// WRONG
const msg = 'Hello ' + name + '!';

// CORRECT
const msg = `Hello ${name}!`;
```

❌ **Manuelle Property-Extraktion**
```javascript
// WRONG
const name = user.name;
const email = user.email;
const role = user.role;

// CORRECT
const { name, email, role } = user;
```

### Edge Cases & Common Pitfalls

**1. Const bedeutet nicht immutable**
```javascript
const obj = { count: 0 };
obj.count = 1; // Erlaubt! Nur die Referenz ist const
// obj = {}; // ERROR! Referenz kann nicht geändert werden
```

**2. Arrow Functions haben kein eigenes `this`**
```javascript
const obj = {
  value: 10,
  getValue: () => this.value // WRONG! 'this' ist window/undefined
};
```

**3. Destructuring kann undefined werfen**
```javascript
const { deeply: { nested } } = {}; // ERROR! Cannot read property 'nested'

// Besser: Optional Chaining + Default
const { deeply: { nested } = {} } = obj || {};
```

---

## Zusammenfassung

**Key Takeaways:**

- **`const`/`let`** ersetzen `var` vollständig - Block Scoping verhindert häufige Bugs
- **Arrow Functions** bieten lexikalisches `this` und kürzere Syntax
- **Template Literals** machen String-Operationen sicher und lesbar
- **Destructuring** extrahiert Werte elegant aus Objekten/Arrays
- **Spread Operator** ermöglicht Immutability Patterns

**Verbindung zum nächsten Kapitel:**

Die gelernten ES6+-Grundlagen sind die Basis für **Asynchrone Programmierung** (Kapitel 2). Promises und Async/Await bauen direkt auf Arrow Functions und const/let auf. Ohne solides ES6-Verständnis ist modernes JavaScript nicht beherrschbar.

---

## Lernziel-Check

Überprüfen Sie, ob Sie folgende Lernziele erreicht haben:

- [ ] **LO-012 (Apply):** const und let korrekt in Block-Scope-Szenarien einsetzen
- [ ] **LO-013 (Analyze):** Unterschiede zwischen Arrow Functions und klassischen Functions erklären
- [ ] **LO-014 (Apply):** Template Literals für String-Interpolation verwenden
- [ ] **LO-015 (Apply):** Destructuring für Objekte und Arrays anwenden
- [ ] **LO-016 (Create):** Spread Operator für Immutable Updates nutzen
- [ ] **LO-017 (Analyze):** Häufige ES6+-Antipatterns erkennen und vermeiden

---

## Übung: Produktkatalog-Manager

**Ziel:** Implementieren Sie einen Produktkatalog mit ES6+-Features.

**Anforderungen:**

1. **Class `ProductCatalog`** mit folgenden Methoden:
   - `addProduct(productData)` - Fügt Produkt hinzu (Pflichtfelder: name, price)
   - `updatePrice(productId, newPrice)` - Aktualisiert Preis (Immutable Pattern!)
   - `findByCategory(category)` - Filtert nach Kategorie
   - `getTotalValue()` - Berechnet Gesamtwert aller Produkte
   - `generateReport()` - Erstellt formatierten Report (Template Literal)

2. **ES6+-Features verwenden:**
   - ✅ const/let (kein var!)
   - ✅ Arrow Functions für Callbacks
   - ✅ Template Literals für Report
   - ✅ Destructuring für productData
   - ✅ Spread Operator für Updates

3. **Error Handling:**
   - Validierung: name darf nicht leer sein
   - Validierung: price muss > 0 sein
   - Throw Error mit aussagekräftiger Message

4. **Test Data:**
```javascript
const catalog = new ProductCatalog();
catalog.addProduct({ name: 'Laptop', price: 999, category: 'Electronics' });
catalog.addProduct({ name: 'Buch: ES6', price: 29.99, category: 'Books' });
catalog.addProduct({ name: 'Kaffee', price: 12.50, category: 'Food' });
```

**Erwartetes Ergebnis:**
```
=== PRODUCT CATALOG ===
Total Products: 3
Total Value: €1041.49

Products:
[ELECTRONICS] Laptop - €999.00
[BOOKS] Buch: ES6 - €29.99
[FOOD] Kaffee - €12.50
=======================
```

**Akzeptanzkriterien:**
- ✅ Alle Methoden implementiert und funktionsfähig
- ✅ Keine var-Verwendung
- ✅ Error Handling mit try/catch
- ✅ Immutable Updates (Original-Array bleibt unverändert)
- ✅ Code läuft ohne Fehler

**Geschätzte Zeit:** 45-60 Minuten

**Bonus-Challenge:**
Implementieren Sie eine `search(query)`-Methode, die Produkte nach Name durchsucht (Case-Insensitive).

---

**Ende Kapitel 1**
