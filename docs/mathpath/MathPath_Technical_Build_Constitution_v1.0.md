# MathPath Technical Build Constitution v1.0

## Purpose

This document defines the architectural rules for all MathPath development.

All future development decisions must align with this document.

If a proposed feature violates these principles, do not implement it without founder approval.

---

# What MathPath Is

MathPath is a Mathematics Mastery Operating System.

MathPath is designed to answer four questions:

1. What does the student know?
2. What does the student not know?
3. Why is the student struggling?
4. What should the student do next?

Every feature should support one or more of these questions.

---

# What MathPath Is Not

MathPath is NOT:

* A worksheet generator
* A video platform
* A content library
* A chatbot tutor
* A gamification platform

Those may exist as supporting features.

They are not the core product.

---

# Core Engine

The core engine consists of:

1. Skill Graph
2. Diagnostic Engine
3. Practice Engine
4. Fluency Engine
5. Retention Engine
6. Working Analysis Engine
7. Mistake-to-Mastery Engine
8. Assessment Engine
9. Academic Outcome Tracking

These systems must remain independent and reusable across all domains.

---

# Student Mastery Model

A skill is mastered only when it is:

* Accurate
* Fluent
* Consistent
* Retained

Correct answers alone do not indicate mastery.

Student states:

Learning

↓

Accurate

↓

Fluent

↓

Retained

---

# Question Data Requirements

Every question record must support:

* questionId
* skillId
* questionFamilyId
* difficulty
* correct
* attempts
* timeTaken
* confidence
* workingUploaded
* assessmentMode
* createdAt

These fields should not be removed.

Future analytics depend on them.

---

# Fluency Principle

Time is a first-class metric.

Do not treat timing as secondary metadata.

Fluency must be tracked at:

* Question level
* Question family level
* Skill level
* Domain level

---

# Retention Principle

The platform must support:

* Day 3 reviews
* Day 7 reviews
* Day 30 reviews
* Day 90 reviews

Skills may lose retained status.

Retention is not permanent.

---

# Input Method Principle

MathPath is input-method agnostic.

Supported methods:

* Paper
* Stylus
* Voice
* Keyboard
* Hybrid

Learning progression must not depend on hardware.

A student using paper must be able to achieve the same outcomes as a student using a stylus.

---

# Paper-First, Stylus-Enhanced Principle

Launch workflow:

Paper + answer entry + working upload.

Future workflow:

Stylus canvas + digital ink analysis.

Do not force digital handwriting.

Do not assume students own tablets.

---

# Working Analysis Principle

MathPath should eventually support:

* OCR
* Handwriting recognition
* Step recognition
* Reasoning analysis
* Misconception detection

Design current systems so future AI analysis can be added without major refactoring.

---

# Calculator Integrity Principle

MathPath encourages authentic mathematical reasoning.

Where appropriate:

* Working should be collected
* Reasoning should be visible
* Methods should be analysed

The goal is educational integrity, not punishment.

---

# Diagnostic Principle

Diagnostics identify root causes.

Diagnostics do not simply assign scores.

Placement should occur at the earliest meaningful weak prerequisite.

---

# Assessment Principle

Assessments simulate school conditions.

Assessments may include:

* Diagrams
* Open-ended questions
* Working requirements
* Timed conditions

Assessment outputs should include:

* Score
* Skill breakdown
* Fluency indicators
* Readiness indicators
* Recommended interventions

---

# First Domain Rule

The first complete domain is:

Fractions F001–F026

Before expanding to:

* Decimals
* Percentage
* Ratio
* Algebra
* Geometry

Fractions must fully support:

* Diagnostics
* Practice
* Fluency
* Retention
* Working uploads
* Working analysis
* Mistake-to-Mastery
* Assessments

---

# Dashboard Principle

Dashboards should show actionable information.

Avoid unnecessary complexity.

Parents should see:

* Progress
* Readiness
* Next actions

Teachers should see:

* Class interventions
* Weak skills
* Assessment trends

Tutors should see:

* Root causes
* Remediation pathways
* Working analysis

---

# Motivation Principle

Avoid excessive gamification.

Use:

* Mastery milestones
* Domain completion
* Academic recognition

Do not prioritise coins, gems, or artificial rewards.

---

# Success Metrics

MathPath success is measured by:

1. Academic improvement
2. Mastery growth
3. Fluency growth
4. Retention growth
5. Parent retention
6. Student retention

Do not optimise for:

* Number of questions generated
* Number of screens built
* Number of features shipped

---

# Long-Term Vision

Build a mathematics mastery engine that can:

* Diagnose learning gaps
* Prescribe targeted practice
* Develop fluency
* Build retention
* Analyse working
* Track academic outcomes

The goal is measurable educational impact.

Always preserve this architecture.

---
