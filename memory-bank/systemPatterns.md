# System Patterns

**System Architecture:**

*   The application is built using Next.js.
*   Data is stored in a CSV file (`public/dataset.csv`).
*   Components are used to display Kanji information and quizzes.

**Key Technical Decisions:**

*   Using Next.js for server-side rendering and routing.
*   Using CSV for data storage due to its simplicity.

**Design Patterns:**

*   Component-based architecture.
*   Using hooks for managing state and side effects.

**Component Relationships:**

*   KanjiCardContainer displays a list of Kanji cards.
*   KanjiCard displays individual Kanji information.
*   QuizCard presents a quiz question.
