# Senior Frontend Engineer Assessment (React / Next.js)

## Context

You are joining an existing e-commerce project that has already been developed by another team and is currently considered production-ready.

The application is functional, but product managers and engineering leaders have identified a number of quality, maintainability, performance and scalability concerns.

Your task is not to rewrite the application from scratch.

Your task is to review the existing implementation, identify the most important issues, make improvements, and document your technical decisions.

You are free to use any tools, including AI-assisted development tools, as long as you can justify your decisions and explain the resulting implementation.

---

## Time Expectation

Expected effort: 4–8 hours.

The goal is not to complete everything.

The goal is to demonstrate engineering judgment, prioritization and technical reasoning.

---

## Project Goals

Review the provided codebase and improve the overall quality of the application.

Focus on:

* Maintainability
* Scalability
* Performance
* Accessibility
* User Experience
* Code Quality
* Type Safety
* Architectural Consistency

---

## Existing Functionality

The application currently contains:

* Product Listing Page
* Product Detail Page
* Search
* Filtering
* Sorting
* Pagination

The application should remain functional after your changes.

---

## Business Requirements

The following requirements have been requested by stakeholders:

### Search Experience

Search results should feel instant and responsive while users are typing.

At the same time, unnecessary network activity should be minimized.

### SEO

Product pages and listing pages should be SEO-friendly.

At the same time, the user experience should remain highly dynamic and interactive.

### Filters

Filters should persist between visits.

Shared URLs should remain readable and user-friendly.

### Analytics

The business would like rich user interaction tracking and analytics.

Bundle size should remain as small as reasonably possible.

### Performance

Application performance should improve.

Avoid introducing unnecessary complexity.

---

## Technical Tasks

### Task 1 — Code Review

Review the codebase and identify the most important technical issues.

Prioritize issues according to business impact.

Not all issues need to be fixed.

---

### Task 2 — Improvements

Implement improvements that you believe provide the highest value.

You are expected to make engineering trade-offs and explain them.

---

### Task 3 — Architecture Notes

Create a short document describing:

* Issues discovered
* Improvements implemented
* Improvements intentionally not implemented
* Technical trade-offs
* Future recommendations

---

### Task 4 — Scalability Exercise

Assume the product catalog grows from 5,000 products to 5,000,000 products.

Describe:

* Frontend changes
* API changes
* Caching strategy
* Search strategy
* Data loading strategy

No implementation is required.

---

## Git Requirements

A significant part of this assessment is evaluating how you work with Git.

### Requirements

Do not submit a single commit.

Use Git as if you were working on a real production team.

Your commit history should clearly communicate:

* What was changed
* Why it was changed
* How the work was broken into logical steps

### Expectations

Examples of meaningful commits:

* fix(search): prevent duplicate requests
* refactor(filters): remove duplicated state
* perf(products): memoize expensive calculations
* a11y(filters): add keyboard navigation support

Avoid commit messages such as:

* update
* fixes
* changes
* final version
* wip

### Branch Strategy

Create a feature branch for your work.

Include:

* Branch name
* Commit history

as part of your submission.

### Important

Assume that your pull request will be reviewed by another senior engineer.

Your Git history should make the review process easy.

---

## Deliverables

Please submit:

1. Source code
2. README.md
3. Architecture Notes
4. Git history
5. Scalability Exercise

---

## Evaluation Criteria

### Engineering Judgment (25%)

Ability to identify and prioritize the most important problems.

### Architecture (20%)

Quality of technical decisions and consistency of implementation.

### Performance (15%)

Awareness of rendering, data loading and optimization concerns.

### Maintainability (15%)

Code organization, readability and separation of concerns.

### Accessibility (10%)

Accessibility awareness and implementation quality.

### Git Workflow (10%)

Commit structure, commit quality and development workflow.

### Documentation (5%)

Clarity of technical communication.

---

## Final Question

You are only allowed to make three changes to this application.

Which three changes would you choose and why?

Assume your answer will determine the next six months of engineering investment in this project.
