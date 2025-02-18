# Flashcard Engine

A customizable flashcard application built with Next.js for learning vocabulary or any other study materials. This engine powers [kantoku.fun](https://kantoku.fun), a Japanese language learning platform.

## Getting Started

1. Get the code:
   - Option A: Clone this repository:
     ```bash
     git clone https://github.com/YOUR_USERNAME/flashcard-engine.git
     cd flashcard-engine
     ```
   - Option B: Download ZIP:
     1. Click the green "Code" button above
     2. Select "Download ZIP"
     3. Extract the ZIP file
     4. Open the extracted folder

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Customize your flashcards:
- Open `/public/dataset.csv`
- Modify the content while keeping the header row intact:
  ```
  id,word,meaning,answer,tag,sentence_example,sentence_meaning
  ```
- Each row represents a flashcard with its properties
- Save your changes

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see your flashcards in action.

## Deployment

The easiest way to deploy your flashcard app is through Vercel:

1. Push your customized version to GitHub
2. Visit [Vercel](https://vercel.com/new)
3. Import your GitHub repository
4. Click "Deploy"

Your flashcard app will be live in minutes!

## Learn More

This project uses:
- [Next.js](https://nextjs.org/docs) - The React framework
- [Geist Font](https://vercel.com/font) - Custom typography
- CSV data format for easy maintenance

For detailed deployment options, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
