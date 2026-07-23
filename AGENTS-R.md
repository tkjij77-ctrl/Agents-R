# 🤖 Agents R

## فريق من الـ AI Agents يشتغلوا مع بعض! 🚀

---

## 💡 الفكرة

بدل ما نستخدم AI واحد بس في OpenCode، بنخلي **فريق كامل من الـ AI models** يشتغلوا مع بعض كأنهم فريق تطوير حقيقي!

### يعني إيه؟

- **Claude** يكون الـ Architect - يصمم النظام
- **GPT-4** يكون الـ Coder - يكتب الكود  
- **Gemini** يكون الـ Reviewer - يراجع الجودة
- **Claude Haiku** يكون الـ Tester - يكتب الاختبارات

كل واحد فيهم بيقدم اللي بيعمله أحسن، وبيشتغلوا مع بعض!

---

## 🎯 المميزات

### 1. 🧠 Orchestrator (المنسق)
- بيحلل الطلب بتاعك
- بيحدد المهام المطلوبة
- بيختار أنسب agent لكل مهمة
- بيتابع التنفيذ

### 2. 🤝 Consensus (التوافق)
- الـ agents بيتشاوروا مع بعض
- بيصوتوا على أحسن حل
- بيحلوا الخلافات بالتصويت
- الخبراء يقروا يوافقوا أو يرفضوا

### 3. 📋 Delegation (التفويض)
- أي agent يقدر يفوض مهمة فرعية
- لو agent محتاج مساعدة، يقدر يطلب من زميله
- سلسلة تفويض حتى 3 مستويات

### 4. 💬 Communication (التواصل)
- Message Bus للتواصل بين الـ agents
- رسائل مباشرة أو broadcasts
- request-reply pattern
- event subscriptions

### 5. 📦 Result Synthesis (تجميع النتائج)
- بيدمج الكود من كل الـ agents
- بيحل التعارضات
- بيجمع الأفكار والرؤى
- بيطلع نتيجة موحدة

---

## 🏗️ البنية المعمارية

```
                    ┌──────────────┐
                    │  User Input  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Orchestrator │ ← بيحلل ويوزع
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌──▼───────┐ ┌─▼──────────┐
       │   Coder     │ │ Reviewer │ │   Tester    │
       │  (GPT-4.1)  │ │(Gemini)  │ │  (Haiku)   │
       └──────┬──────┘ └──┬───────┘ └─┬──────────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼───────┐
                    │  Consensus   │ ← بيتشاوروا
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Synthesize  │ ← بيجمع النتائج
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │Final Output  │
                    └──────────────┘
```

---

## 📁 هيكل المشروع

```
packages/multi-agent/
├── src/
│   ├── index.ts                    # الـ exports الرئيسية
│   ├── config.ts                   # إعدادات النظام
│   ├── agents/types/               # أنواع الـ agents
│   ├── orchestrator/               # المنسق
│   │   ├── orchestrator-service.ts # خدمة التنسيق
│   │   ├── task-decomposer.ts      # تقسيم المهام
│   │   ├── agent-selector.ts       # اختيار الـ agents
│   │   └── result-synthesizer.ts   # تجميع النتائج
│   ├── consensus/                  # نظام التوافق
│   ├── delegation/                 # نظام التفويض
│   ├── communication/              # نظام التواصل
│   └── protocols/                  # بروتوكولات التواصل
```

---

## 🚀 أمثلة عملية

### مثال 1: "اعمللي REST API مع tests"

```
Orchestrator يقسم المهمة:
├── [Architect/Claude]  → تصميم الـ API structure
├── [Coder/GPT-4]       → كتابة الـ endpoints (بعد Architect)
├── [Tester/Haiku]      → كتابة الـ tests (بعد Coder)
└── [Reviewer/Gemini]   → مراجعة كل حاجة (بعد الكل)
```

### مثال 2: "صلح الـ bug ده"

```
Orchestrator يستخدم peer-review mode:
├── [Debugger/GPT-4]   → تشخيص المشكلة
├── [Coder/Claude]      → تطبيق الإصلاح
└── [Reviewer/Gemini]   → التأكد + اقتراحات
```

### مثال 3: "اعمل refactor للمودول ده"

```
Orchestrator يستخدم consensus mode:
├── [Architect/Claude]  → يقترح الـ architecture
├── [Coder/GPT-4]       → يقترح الـ implementation
├── [Reviewer/Gemini]   → يقترح strategy الاختبار
└── [Consensus]         → الكل يتفق على الحل النهائي
```

---

## ⚙️ الإعدادات

```json
{
  "agents-r": {
    "mode": "orchestrated",
    "agents": [
      {
        "name": "Claude Architect",
        "role": "architect",
        "model": "claude-sonnet-4-5",
        "capabilities": ["architecture", "code-review"]
      },
      {
        "name": "GPT Coder",
        "role": "coder",
        "model": "gpt-4.1",
        "capabilities": ["code-generation", "debugging"]
      }
    ],
    "consensus": {
      "strategy": "weighted",
      "threshold": 0.7,
      "maxRounds": 5
    }
  }
}
```

---

## 📊 حالة التطوير

- [x] Core types و interfaces
- [x] Orchestrator Service
- [x] Task Decomposer
- [x] Agent Selector (scoring algorithm)
- [x] Consensus Engine (voting strategies)
- [x] Delegation System
- [x] Communication Layer (Message Bus)
- [x] Protocols
- [x] Result Synthesizer
- [x] Configuration System
- [ ] Agent Runtime (LLM Integration)
- [ ] CLI Interface
- [ ] TUI Integration
- [ ] Session Persistence
- [ ] Cost Tracking
- [ ] Performance Metrics

---

## 📝 ملاحظات

- المشروع مبني على أساس [OpenCode](https://opencode.ai/) (MIT License)
- بيستخدم TypeScript و Effect library
- متوافق مع كل مزودي الـ LLM (Anthropic, OpenAI, Google, etc.)

---

## 🤝 المساهمة

المشروع لسه في المرحلة الأولى. أي مساهمة مرحب بيها!
