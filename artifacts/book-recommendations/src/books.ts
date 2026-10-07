export type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  summary: string;
  rating: number;
  hours: number;
  moods: string[];
  palette: [string, string, string];
  motif: string;
};

export const books: Book[] = [
  { id: 'little-prince', title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', genre: 'Fiction', summary: 'A wandering pilot meets a small prince whose travels reveal what matters, and what grown-ups miss.', rating: 4.8, hours: 2, moods: ['Thoughtful', 'Hopeful'], palette: ['#b7745e', '#e6c195', '#f5e8cd'], motif: 'orbit' },
  { id: 'the-hobbit', title: 'The Hobbit', author: 'J. R. R. Tolkien', genre: 'Fantasy', summary: 'A comfort-loving hobbit is swept into a perilous quest for a dragon’s treasure.', rating: 4.7, hours: 8, moods: ['Adventurous', 'Hopeful'], palette: ['#426c56', '#b6a466', '#e7d7ad'], motif: 'mountain' },
  { id: 'educated', title: 'Educated', author: 'Tara Westover', genre: 'Memoir', summary: 'A daughter raised apart from the world discovers the power and cost of an education.', rating: 4.6, hours: 7, moods: ['Thoughtful', 'Motivated'], palette: ['#a65f4b', '#d7ac79', '#eed9b4'], motif: 'stairs' },
  { id: 'dune', title: 'Dune', author: 'Frank Herbert', genre: 'Science fiction', summary: 'On the desert planet Arrakis, ecology, empire, and prophecy collide in an epic struggle.', rating: 4.6, hours: 13, moods: ['Adventurous', 'Thoughtful'], palette: ['#ad6848', '#dfb26e', '#f0ddad'], motif: 'sun' },
  { id: 'circe', title: 'Circe', author: 'Madeline Miller', genre: 'Fantasy', summary: 'The mythic witch finds her own strength in a life lived beyond the gods’ expectations.', rating: 4.5, hours: 9, moods: ['Thoughtful', 'Escapist'], palette: ['#315e56', '#a8aa77', '#e7d2a1'], motif: 'moon' },
  { id: 'atomic-habits', title: 'Atomic Habits', author: 'James Clear', genre: 'Personal growth', summary: 'A practical guide to tiny, repeatable changes that make good habits easier to keep.', rating: 4.5, hours: 5, moods: ['Motivated', 'Focused'], palette: ['#637c60', '#c5b575', '#f0e6c8'], motif: 'rings' },
  { id: 'percy-jackson', title: 'The Lightning Thief', author: 'Rick Riordan', genre: 'Fantasy', summary: 'A New York kid discovers he is a demigod, then races across America to prevent a war.', rating: 4.4, hours: 6, moods: ['Adventurous', 'Hopeful'], palette: ['#426c7a', '#74a6a0', '#e9dcae'], motif: 'wave' },
  { id: 'sapiens', title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'Nonfiction', summary: 'A sweeping, provocative account of how stories and shared ideas shaped human history.', rating: 4.4, hours: 12, moods: ['Curious', 'Thoughtful'], palette: ['#9c694f', '#d1a16d', '#f0dfbc'], motif: 'sun' },
  { id: 'book-thief', title: 'The Book Thief', author: 'Markus Zusak', genre: 'Historical fiction', summary: 'In wartime Germany, a foster girl finds refuge in words, friendship, and quiet courage.', rating: 4.6, hours: 9, moods: ['Thoughtful', 'Hopeful'], palette: ['#526b64', '#b87159', '#e6d7ae'], motif: 'stars' },
  { id: 'kitchen-confidential', title: 'Kitchen Confidential', author: 'Anthony Bourdain', genre: 'Memoir', summary: 'A lively, candid backstage pass to the heat, chaos, and unlikely poetry of restaurant life.', rating: 4.3, hours: 6, moods: ['Curious', 'Adventurous'], palette: ['#a9523f', '#db9c5c', '#eee0bd'], motif: 'plate' },
  { id: 'pride-prejudice', title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Romance', summary: 'Elizabeth Bennet and Mr. Darcy spar, misjudge, and slowly see one another clearly.', rating: 4.7, hours: 8, moods: ['Hopeful', 'Thoughtful'], palette: ['#8d5b55', '#d59d83', '#f0dfcb'], motif: 'rose' },
  { id: 'fahrenheit-451', title: 'Fahrenheit 451', author: 'Ray Bradbury', genre: 'Science fiction', summary: 'In a future that burns books, one fireman begins to wonder what the flames are hiding.', rating: 4.3, hours: 4, moods: ['Thoughtful', 'Focused'], palette: ['#a64738', '#dd8a4d', '#edc982'], motif: 'flame' },
  { id: 'alchemist', title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', summary: 'A young shepherd follows a recurring dream across the desert in search of a hidden treasure.', rating: 4.2, hours: 3, moods: ['Hopeful', 'Motivated'], palette: ['#a46e3e', '#d1aa60', '#f0e0ae'], motif: 'moon' },
  { id: 'silent-patient', title: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Mystery', summary: 'A therapist becomes consumed by the case of a painter who has not spoken since a crime.', rating: 4.2, hours: 5, moods: ['Focused', 'Curious'], palette: ['#475c56', '#a96a5d', '#d8c2a1'], motif: 'eye' },
  { id: 'braiding-sweetgrass', title: 'Braiding Sweetgrass', author: 'Robin Wall Kimmerer', genre: 'Nonfiction', summary: 'Botany, Indigenous knowledge, and gratitude intertwine in a generous invitation to notice.', rating: 4.7, hours: 10, moods: ['Thoughtful', 'Calm'], palette: ['#536f58', '#9b9b68', '#e5d6a6'], motif: 'leaf' },
  { id: 'midnight-library', title: 'The Midnight Library', author: 'Matt Haig', genre: 'Fiction', summary: 'Between life and death, a library offers a woman the chance to try out all her possible lives.', rating: 4.2, hours: 5, moods: ['Hopeful', 'Thoughtful'], palette: ['#315c59', '#648b78', '#e0c58e'], motif: 'stars' },
];

const motifMarkup: Record<string, string> = {
  orbit: '<circle cx="150" cy="110" r="42"/><ellipse cx="150" cy="110" rx="74" ry="25" transform="rotate(-30 150 110)"/><circle cx="207" cy="74" r="4" fill="currentColor"/>',
  mountain: '<path d="M42 185 111 86l33 48 31-38 83 89Z" fill="currentColor"/><circle cx="213" cy="53" r="19" fill="currentColor"/>',
  stairs: '<path d="M55 180h34v-25h32v-25h32v-25h32V80h34" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="181" cy="55" r="14"/>',
  sun: '<circle cx="150" cy="110" r="42"/><circle cx="150" cy="110" r="61" fill="none" stroke="currentColor" stroke-width="2"/><path d="M150 26v21M150 173v21M66 110h21M213 110h21M91 51l15 15M194 154l15 15M209 51l-15 15M106 154l-15 15" stroke="currentColor" stroke-width="3"/>',
  moon: '<path d="M183 52a62 62 0 1 0 24 109A69 69 0 0 1 183 52Z"/><circle cx="93" cy="65" r="3"/><circle cx="221" cy="132" r="3"/>',
  rings: '<circle cx="150" cy="110" r="56" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="150" cy="110" r="39" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="150" cy="110" r="20"/>',
  wave: '<path d="M40 113q28-30 56 0t56 0 56 0 56 0M40 144q28-30 56 0t56 0 56 0 56 0" fill="none" stroke="currentColor" stroke-width="5"/>',
  stars: '<path d="m150 51 9 39 38 10-38 10-9 39-10-39-38-10 38-10zM213 150l4 17 17 4-17 4-4 17-4-17-17-4 17-4z"/>',
  plate: '<circle cx="150" cy="112" r="57" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="150" cy="112" r="39" fill="none" stroke="currentColor" stroke-width="2"/><path d="M74 62v49M64 62v20m20-20v20m102-20v49m-10-49v20" fill="none" stroke="currentColor" stroke-width="3"/>',
  rose: '<path d="M150 169c-18-26-54-44-34-72 10-15 32-8 34 7 7-22 42-22 43 3 1 20-22 43-43 62Zm0 0v36m0-19-25-14m25 5 24-15" fill="none" stroke="currentColor" stroke-width="4"/>',
  flame: '<path d="M152 51c8 32-22 39-13 63 5 13 19 13 23 0 30 36 18 69-10 76-30 8-57-17-49-47 4-17 20-28 18-52 16 9 18 27 14 37 17-21 24-43 17-77Z"/>',
  eye: '<path d="M62 111q88-87 176 0-88 87-176 0Z" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="150" cy="111" r="25" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="150" cy="111" r="7"/>',
  leaf: '<path d="M213 54C119 50 67 90 75 155c4 35 43 43 67 22 34-30 34-83 71-123ZM82 186q48-65 105-103" fill="none" stroke="currentColor" stroke-width="4"/>',
};

export function coverImage(book: Book) {
  const [base, secondary, ink] = book.palette;
  const art = motifMarkup[book.motif] ?? motifMarkup.stars;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${base}"/><stop offset="1" stop-color="${secondary}"/></linearGradient></defs><rect width="300" height="400" fill="url(#g)"/><path d="M18 0v400" stroke="#171e1b" stroke-opacity=".18" stroke-width="12"/><g color="${ink}" fill="${ink}" opacity=".78">${art}</g><rect x="26" y="23" width="248" height="354" fill="none" stroke="#f8f0dd" stroke-opacity=".65"/><text x="150" y="270" text-anchor="middle" font-family="Georgia,serif" font-size="26" font-weight="bold" fill="#fff4dc">${book.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text><text x="150" y="302" text-anchor="middle" font-family="sans-serif" font-size="10" letter-spacing="2" fill="#fff4dc" opacity=".9">${book.author.toUpperCase().replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text><text x="150" y="350" text-anchor="middle" font-family="sans-serif" font-size="8" letter-spacing="3" fill="#fff4dc" opacity=".7">A GOOD READ</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
