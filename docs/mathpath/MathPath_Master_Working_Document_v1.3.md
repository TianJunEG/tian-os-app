# Tian OS MathPath Master Working Document v1.3

## Status

Founder Working Draft

Purpose:

This document serves as the master blueprint for Tian OS MathPath.

All future product decisions, curriculum design, AI workflows, development work, diagnostics, dashboards, assessments, and learning pathways should align with this document.

---

# Executive Summary

MathPath is an AI-native Mathematics Mastery Operating System.

It is not a worksheet generator.

It is not a video platform.

It is not an AI chatbot.

Its purpose is to determine:

- What the student knows
- What the student does not know
- Why the student is struggling
- What the student should do next

The ultimate goal is measurable academic improvement.

---

# Product Vision

Traditional learning platforms focus on:

- Content delivery
- Question banks
- Video lessons

MathPath focuses on:

- Diagnostics
- Mastery
- Fluency
- Retention
- Working Analysis
- Assessments
- Academic Outcomes

The platform continuously identifies the next best learning action for every student.

---

# Core Philosophy

A student has not mastered a skill simply because they answered correctly once.

A student has mastered a skill when they can:

- Solve accurately
- Solve quickly
- Solve consistently
- Retain the skill over time
- Demonstrate correct mathematical reasoning

---

# Mastery Formula

Mastery Score = Accuracy × Fluency × Retention × Consistency

Weakness in any component reduces mastery.

---

# Three Learning Layers

## Layer 1: Diagnostic Mode

Purpose:

Identify learning gaps.

Output:

- Weak skills
- Missing prerequisites
- Root causes
- Placement recommendations
- Remediation pathways

The diagnostic is not a test.

It is a learning scan.

---

## Layer 2: MathPath (Mastery Mode)

Purpose:

Build mastery.

Students progress through skills rather than school levels.

MathPath focuses on:

- Mastery
- Fluency
- Retention
- Misconceptions

---

## Layer 3: ExamPath (Assessment Mode)

Purpose:

Measure readiness and performance.

ExamPath provides:

- Topic assessments
- Mock papers
- Timed assessments
- School-style assessments

Outputs:

- Scores
- Skill breakdowns
- Readiness indicators
- Intervention recommendations

---

# SchoolPath

SchoolPath is the curriculum layer.

Purpose:

- Exam preparation
- School support
- Curriculum alignment

SchoolPath follows:

- Primary 1–6
- Secondary 1–4

SchoolPath maps directly to MathPath skills.

SchoolPath answers:

"What is the school teaching?"

MathPath answers:

"What does the student need?"

---

# Student Skill States

Learning → Accurate → Fluent → Retained

---

# Accuracy Framework

Accuracy measures:

- Correctness
- Reliability
- Consistency

Accuracy alone does not indicate mastery.

---

# Fluency Framework

Fluency measures:

- Speed
- Efficiency
- Automaticity

Students who are correct but slow are not yet fluent.

The system identifies:

- Accurate but slow
- Fast but inaccurate
- Fluent
- Retained

---

# Retention Engine

Retention measures whether mastery persists over time.

Review schedule:

- Day 3
- Day 7
- Day 30
- Day 90

Skills may lose Retained status if performance declines.

---

# Spaced Repetition Engine

The platform automatically schedules review activities.

Inputs:

- Mastery
- Fluency
- Retention risk

Outputs:

- Review recommendations
- Reinforcement sessions

Purpose:

Prevent forgetting.

---

# Confidence Tracking

Students may be asked:

How confident are you?

Options:

- Very Confident
- Confident
- Unsure
- Guessing

This helps distinguish:

Correct + Mastered

from

Correct + Lucky Guess

---

# Question Architecture

Domain → Skill → Question Family → Question

Example:

Fractions → F020 Fraction of Quantity → Word Problems → Specific Question

---

# Question Data Model

Every question records:

- Skill ID
- Question Family ID
- Difficulty
- Correct / Incorrect
- Time Taken
- Attempts
- Hints Used
- Confidence
- Working Uploaded
- Assessment Mode

---

# Question Family Fluency

Fluency is measured at multiple levels.

Example:

F020 Fraction of Quantity

Question Families:

- Unit Fractions
- Non-Unit Fractions
- Multiples
- Non-Multiples
- Word Problems
- Multi-Step Problems

This allows precise remediation.

---

# Fractions Vertical

First complete MathPath domain.

Skills:

F001 Recognise Fractions

F002 Numerator and Denominator

F003 Fraction of a Whole

F004 Unit Fractions

F005 Fractions on Number Line

F006 Compare Unit Fractions

F007 Compare Same Denominator

F008 Compare Same Numerator

F009 Order Fractions

F010 Equivalent Fractions

F011 Generate Equivalent Fractions

F012 Simplify Fractions

F013 Improper Fractions

F014 Mixed Numbers

F015 Convert Mixed ↔ Improper

F016 Add Same Denominator

F017 Subtract Same Denominator

F018 Add Different Denominators

F019 Subtract Different Denominators

F020 Fraction of Quantity

F021 Multiply Fractions

F022 Divide Fractions

F023 Fraction Word Problems

F024 Multi-Step Fraction Problems

F025 Exam-Style Applications

F026 Fractions Mastery Challenge

---

# Diagnostic Design

Stage 1: Strand Screening

- Foundation
- Comparison
- Equivalence
- Conversion
- Operations
- Applications

Stage 2: Root Cause Investigation

Example:

Student fails Add Unlike Fractions.

System checks:

Equivalent Fractions → Common Denominators → Root Cause

Placement occurs at the earliest meaningful weak skill.

---

# Input Methods Framework

MathPath is input-method agnostic.

Students may use:

- Paper
- Stylus
- Voice
- Keyboard
- Hybrid combinations

The mastery engine remains independent of the input method.

---

# Method A: Paper Workspace (Default)

Workflow:

Question → Student works on paper → Student enters answer → Working uploaded after session

Benefits:

- Matches school conditions
- No special hardware required
- Supports desktop users

This is the primary launch workflow.

---

# Method B: Stylus Workspace

Supports:

- Apple Pencil
- Samsung S Pen
- Surface Pen
- Compatible styluses

Workflow:

Question → Student writes on digital canvas → Working automatically stored

Future capabilities:

- Stroke analysis
- Reasoning analysis
- Error pattern analysis

---

# Method C: Voice Workspace

Used primarily for Mental Math.

Workflow:

Question spoken aloud → Student responds verbally → Speech recognition processes answer

Measures:

- Accuracy
- Recall speed
- Automaticity

---

# Method D: Hybrid Workspace

Students may combine:

- Paper
- Stylus
- Voice
- Keyboard

within the same session.

---

# Paper-First, Stylus-Enhanced Philosophy

Mathematics should feel natural.

Students should not be forced into digital handwriting.

Paper remains fully supported.

Stylus users receive additional convenience.

Learning progression remains identical.

---

# Working Requirements

Default Rule:

If working is normally required in school, working is required in MathPath.

Exceptions:

- Mental Math
- Number Bonds
- Arithmetic Recall
- Oral Fluency

---

# Working Workflow

During Practice:

Student:

- Solves on paper
- Enters answer

Working is uploaded after the session.

This prevents disruption of fluency practice.

---

# Assessment Workflow

Student:

1. Completes assessment
2. Records answers
3. Completes workings
4. Uploads workings after assessment

This preserves exam authenticity.

---

# Working Analysis Engine

Purpose:

Understand how the student arrived at an answer.

The system analyses:

- Procedures
- Reasoning
- Missing steps
- Mathematical misconceptions

Goal:

Move beyond answer checking.

---

# Working Quality Score

Measures:

- Legibility
- Organisation
- Completeness

Ratings:

- Excellent
- Good
- Needs Improvement

Purpose:

Develop examination habits.

---

# Calculator Integrity Model

The system encourages authentic mathematical reasoning.

Working analysis helps identify:

- Missing reasoning
- Calculator dependency
- Suspicious answer patterns

The goal is not policing.

The goal is learning integrity.

---

# Mistake-to-Mastery Engine

Initial Taxonomy:

M001 Whole-Number Thinking

M002 Numerator-Only Comparison

M003 Denominator Confusion

M004 Equivalent Fraction Weakness

M005 Simplification Error

M006 Mixed Number Conversion Error

M007 Common Denominator Error

M008 Operation Selection Error

M009 Multiplication/Division Procedure Error

M010 Careless Arithmetic Error

The engine recommends targeted remediation.

---

# Oral Mental Math Module

Separate from standard practice.

Purpose:

Develop automaticity.

Daily Duration:

3–5 minutes

Activities:

- Number Bonds
- Multiplication Facts
- Division Facts
- Fraction Facts
- Percentage Facts
- Mental Arithmetic

Metrics:

- Accuracy
- Response Time
- Fluency
- Confidence

---

# Assessment System

Assessment Types:

- Baseline Assessment
- Progress Assessment
- Mastery Assessment
- Mock Examination
- Curriculum Assessment

Outputs:

- Score
- Skill Breakdown
- Fluency Indicators
- Readiness Indicators

---

# Readiness Predictor

Inputs:

- Mastery
- Fluency
- Retention
- Assessment Performance

Output:

Predicted Assessment Readiness Score

Purpose:

Help parents understand readiness.

---

# Parent Action Plans

Every week the platform generates:

- Skills to focus on
- Recommended practice time
- Recommended assessments
- Intervention suggestions

Parents should always know the next step.

---

# Parent Dashboard

Displays:

- Skills Mastered
- Current Weaknesses
- Fluency Level
- Assessment Scores
- Improvement Trends
- Readiness Indicators

Avoid technical jargon.

---

# Teacher Dashboard

Displays:

- Class Readiness
- Weak Skills
- Intervention Groups
- Fluency Data
- Assessment Outcomes

---

# Tutor Dashboard

Displays:

- Root Causes
- Weak Skills
- Intervention Plans
- Working Analysis
- Assessment History

---

# Student Motivation Framework

Avoid excessive gamification.

Use:

- Foundation
- Builder
- Explorer
- Master
- Scholar

Recognition:

- Domain Certificates
- Mastery Milestones
- Achievement Records

---

# Academic Outcome Tracking

Parents may upload:

- WA
- Mid-Year
- EOY
- School Assessments

Track:

Baseline → Improvement → Long-Term Growth

Ultimate KPI:

Improvement in real academic outcomes.

---

# Future Content Marketplace

Future phase.

Teachers may contribute:

- Topic Lessons
- Exam Workshops
- Problem Solving Sessions
- Olympiad Lessons

Content attaches to skills.

The mastery engine remains the primary product.

---

# Success Metrics

MathPath is evaluated using:

1. Academic Improvement
2. Mastery Growth
3. Fluency Growth
4. Retention Growth
5. Parent Retention
6. Student Retention

Not:

- Questions Generated
- Screens Built
- Features Shipped

---

# Build Order

Phase 1: Fractions Skill Graph F001–F026

Phase 2: Diagnostic Engine

Phase 3: Practice Engine

Phase 4: Fluency Engine

Phase 5: Retention Engine

Phase 6: Working Upload Workflow

Phase 7: Working Analysis Engine

Phase 8: Mistake-to-Mastery

Phase 9: Assessment Engine

Phase 10: Parent Dashboard

Phase 11: Teacher Dashboard

Phase 12: Tutor Dashboard

---

# Long-Term Vision

Tian OS becomes the operating system for mathematics mastery.

A system that understands:

- What a student knows
- What a student does not know
- Why they are struggling
- What they should practise next
- Whether they have achieved mastery
- Whether they can retain mastery
- Whether their academic performance is improving

The goal is not more content.

The goal is measurable mastery, fluency, retention, and academic success.
