import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ArrowDown, Bookmark, BookOpen, Check, Clock3, Heart, Info, Search, Sparkles, Star, X } from 'lucide-react';
import { books, coverImage, type Book } from './books';

const queryClient = new QueryClient();
const genres = ['All genres', ...Array.from(new Set(books.map((book) => book.genre)))];
const STORAGE_KEY = 'book-guide-saved-v1';

function readSaved() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function BookCard({ book, saved, onFavorite, onDetails, order }: {
  book: Book;
  saved: boolean;
  onFavorite: (id: string) => void;
  onDetails: (book: Book) => void;
  order: number;
}) {
  const image = coverImage(book);
  return (
    <article className="book-card" style={{ animationDelay: `${Math.min(order * 45, 360)}ms` }} data-testid={`card-book-${book.id}`}>
      <div className="cover-wrap" role="button" tabIndex={0} aria-label={`View details for ${book.title}`} onClick={() => onDetails(book)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onDetails(book); } }}>
        <img src={image} alt={`Illustrated cover for ${book.title} by ${book.author}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div className="card-topline">
        <span className="genre-tag">{book.genre}</span>
        <button className={`heart-btn ${saved ? 'is-favorite' : ''}`} type="button" onClick={() => onFavorite(book.id)} aria-label={saved ? `Remove ${book.title} from saved books` : `Save ${book.title}`} aria-pressed={saved} data-testid={`button-save-${book.id}`} title={saved ? 'Remove from saved' : 'Save book'}>
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.8} />
        </button>
      </div>
      <h3>{book.title}</h3>
      <p className="author">{book.author}</p>
      <p className="summary">{book.summary}</p>
      <div className="card-meta">
        <span className="rating"><Star size={11} fill="currentColor" style={{ verticalAlign: '-1px', marginRight: 3 }} />{book.rating.toFixed(1)}</span>
        <span><Clock3 size={11} style={{ verticalAlign: '-1px', marginRight: 3 }} />{book.hours} hr read</span>
        <span>{book.moods[0]}</span>
      </div>
      <div className="card-actions">
        <button type="button" className="details-btn" onClick={() => onDetails(book)} data-testid={`button-details-${book.id}`}>Book details</button>
      </div>
    </article>
  );
}

function Skeletons() {
  return <div className="loading-grid" aria-label="Loading book recommendations" role="status" data-testid="status-loading-books">{[0, 1, 2, 3].map((item) => <div className="skeleton-card" key={item}><div className="skeleton-cover" /><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}</div>;
}

function Home() {
  const [view, setView] = useState<'discover' | 'saved'>('discover');
  const [savedIds, setSavedIds] = useState<string[]>(readSaved);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('All genres');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [maxHours, setMaxHours] = useState('any');
  const [recommendationActive, setRecommendationActive] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds)); } catch { /* Keep this session usable when storage is unavailable. */ }
  }, [savedIds]);

  useEffect(() => {
    if (!selectedBook) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedBook(null); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedBook]);

  const toggleFavorite = (id: string) => setSavedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const savedBooks = useMemo(() => books.filter((book) => savedIds.includes(book.id)), [savedIds]);
  const displayedBooks = useMemo(() => {
    let result = view === 'saved' ? savedBooks : books;
    const query = search.trim().toLocaleLowerCase();
    if (query) result = result.filter((book) => `${book.title} ${book.author} ${book.genre} ${book.summary}`.toLocaleLowerCase().includes(query));
    if (view === 'discover' && genreFilter !== 'All genres') result = result.filter((book) => book.genre === genreFilter);
    if (view === 'discover' && recommendationActive) {
      if (maxHours !== 'any') result = result.filter((book) => book.hours <= Number(maxHours));
      result = [...result].sort((a, b) => {
        const score = (book: Book) => (selectedGenre && book.genre === selectedGenre ? 5 : 0) + (selectedMood && book.moods.includes(selectedMood) ? 4 : 0) + book.rating / 5;
        return score(b) - score(a);
      });
    }
    return result;
  }, [view, savedBooks, search, genreFilter, recommendationActive, maxHours, selectedGenre, selectedMood]);

  const runRecommendation = () => {
    setRecommendationActive(true);
    setView('discover');
  };
  const clearPreferences = () => {
    setRecommendationActive(false);
    setSelectedGenre('');
    setSelectedMood('');
    setMaxHours('any');
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="Between the Covers home">
          <span className="brand-mark"><BookOpen size={19} strokeWidth={1.8} /></span>
          <span>between the covers</span>
        </div>
        <nav className="nav-actions" aria-label="Main navigation">
          <button type="button" className={`nav-btn ${view === 'discover' ? 'active' : ''}`} onClick={() => setView('discover')} data-testid="button-discover">Discover</button>
          <button type="button" className={`nav-btn ${view === 'saved' ? 'active' : ''}`} onClick={() => setView('saved')} data-testid="button-saved">
            Saved <span className="saved-count" aria-label={`${savedIds.length} saved books`}>{savedIds.length}</span>
          </button>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">Your next chapter starts here</div>
          <h1>A book for<br />where you <em>are.</em></h1>
          <p>For the curious, the tired, the wide-awake-at-midnight. Find a story that fits your interests, your time, and the way today feels.</p>
          <div className="hero-stats" aria-label="Catalogue information">
            <div className="hero-stat"><strong>16</strong><span>handpicked reads</span></div>
            <div className="hero-stat"><strong>2–13h</strong><span>from quick to epic</span></div>
            <div className="hero-stat"><strong>8</strong><span>ways to feel</span></div>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="book-stack">
            <div className="sun-doodle" />
            <div className="book book-one"><div className="book-cover-copy"><span className="book-cover-title">A little<br />wonder</span><span className="book-cover-author">take the scenic way</span></div></div>
            <div className="book book-two"><div className="book-cover-copy"><span className="book-cover-title">The<br />green<br />horizon</span><span className="book-cover-author">stories for the curious</span></div></div>
            <div className="book book-three"><div className="book-cover-copy"><span className="book-cover-title">Somewhere<br />in between</span><span className="book-cover-author">a field guide to wonder</span></div></div>
            <div className="orbit-note"><strong>Good stories</strong><br />meet you where you are.</div>
          </div>
        </div>
      </section>

      <section className="main-content" id="books">
        <div className="content-inner">
          {view === 'discover' ? (
            <>
              <div className="section-heading">
                <div><h2>Find your kind of book</h2><p>Start with a feeling, a genre, or just follow a thread.</p></div>
                <div className="discover-tools">
                  <label className="searchbox">
                    <Search size={15} aria-hidden="true" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, author, a word..." aria-label="Search books by title, author, genre, or description" data-testid="input-search-books" />
                  </label>
                  <label>
                    <span className="sr-only">Filter by genre</span>
                    <select className="filter-select" value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)} aria-label="Filter by genre" data-testid="select-genre-filter">
                      {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              <section className="finder" aria-label="Personalized book finder">
                <div className="finder-intro"><span className="finder-icon"><Sparkles size={19} /></span><div><strong>Pick a reading mood</strong><span>A few clues make a good starting point.</span></div></div>
                <div>
                  <span className="field-label">I feel like...</span>
                  <div className="choice-row" role="group" aria-label="Choose a genre">
                    {['Fiction', 'Fantasy', 'Mystery', 'Nonfiction', 'Romance'].map((genre) => <button type="button" key={genre} className={`choice ${selectedGenre === genre ? 'selected' : ''}`} aria-pressed={selectedGenre === genre} onClick={() => setSelectedGenre(selectedGenre === genre ? '' : genre)} data-testid={`choice-genre-${genre.toLowerCase().replaceAll(' ', '-')}`}>{genre}</button>)}
                  </div>
                </div>
                <div>
                  <span className="field-label">I want to feel...</span>
                  <div className="choice-row" role="group" aria-label="Choose a mood">
                    {['Thoughtful', 'Hopeful', 'Adventurous', 'Motivated', 'Curious'].map((mood) => <button type="button" key={mood} className={`choice ${selectedMood === mood ? 'selected' : ''}`} aria-pressed={selectedMood === mood} onClick={() => setSelectedMood(selectedMood === mood ? '' : mood)} data-testid={`choice-mood-${mood.toLowerCase()}`}>{mood}</button>)}
                  </div>
                </div>
                <div>
                  <label className="field-label" htmlFor="time-limit">Time I have</label>
                  <select id="time-limit" className="time-select" value={maxHours} onChange={(event) => setMaxHours(event.target.value)} data-testid="select-reading-time">
                    <option value="any">Any reading time</option>
                    <option value="3">A couple of hours · up to 3h</option>
                    <option value="5">An afternoon · up to 5h</option>
                    <option value="8">A weekend · up to 8h</option>
                    <option value="12">Room for an epic · up to 12h</option>
                  </select>
                  <button type="button" className="recommend-btn" style={{ marginTop: 8, width: '100%' }} onClick={runRecommendation} data-testid="button-find-books">Find my books <ArrowDown size={13} style={{ verticalAlign: '-2px', marginLeft: 4 }} /></button>
                </div>
              </section>

              {recommendationActive && <p className="recommendation-note" role="status" data-testid="status-recommendation"><Sparkles size={13} /> {displayedBooks.length} matches, ranked by your clues and reader rating. <button type="button" className="nav-btn" style={{ padding: '3px 8px', color: '#a35f49' }} onClick={clearPreferences} data-testid="button-clear-preferences">Clear picks</button></p>}
              <div className="shelf-label">{recommendationActive ? 'Your reading shortlist' : 'A few good places to begin'}</div>
              {loading ? <Skeletons /> : displayedBooks.length ? (
                <div className="book-grid" data-testid="grid-books">
                  {displayedBooks.map((book, index) => <BookCard key={book.id} book={book} saved={savedIds.includes(book.id)} onFavorite={toggleFavorite} onDetails={setSelectedBook} order={index} />)}
                </div>
              ) : (
                <div className="empty-state" role="status" data-testid="status-no-matches">
                  <div className="empty-mark"><Search size={20} /></div>
                  <h3>{recommendationActive ? 'No books fit that mix—yet.' : 'Nothing on this shelf.'}</h3>
                  <p>{recommendationActive ? 'Try a longer reading window or clear a preference to widen the search.' : 'Try another search or choose a different genre.'}</p>
                  {recommendationActive && <button type="button" className="details-btn" style={{ marginTop: 15 }} onClick={clearPreferences} data-testid="button-reset-recommendation">Reset recommendations</button>}
                </div>
              )}
            </>
          ) : (
            <div className="saved-view">
              <div className="saved-intro">
                <div><span className="eyebrow">A little shelf of your own</span><h2>Books to come back to.</h2><p>Keep the ones that caught your eye close by.</p></div>
                <div className="saved-number" aria-label={`${savedBooks.length} saved books`}>{String(savedBooks.length).padStart(2, '0')}</div>
              </div>
              <div className="section-heading">
                <div><h2>Your saved shelf</h2><p>{savedBooks.length ? 'Tap the heart to take a book off your list.' : 'Save a book while browsing and it will find a home here.'}</p></div>
                <label className="searchbox">
                  <Search size={15} aria-hidden="true" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your saved books..." aria-label="Search saved books" data-testid="input-search-saved" />
                </label>
              </div>
              {loading ? <Skeletons /> : displayedBooks.length ? <div className="book-grid" data-testid="grid-saved-books">{displayedBooks.map((book, index) => <BookCard key={book.id} book={book} saved onFavorite={toggleFavorite} onDetails={setSelectedBook} order={index} />)}</div> : (
                <div className="empty-state" role="status" data-testid="status-empty-saved">
                  <div className="empty-mark"><Bookmark size={20} /></div>
                  <h3>{savedBooks.length ? 'No saved book found.' : 'Your shelf is ready.'}</h3>
                  <p>{savedBooks.length ? 'Try another title or author.' : 'When a book feels right, tap its heart to keep it here.'}</p>
                  {!savedBooks.length && <button type="button" className="details-btn" style={{ marginTop: 15, maxWidth: 150 }} onClick={() => { setView('discover'); setSearch(''); }} data-testid="button-browse-books">Browse the books</button>}
                </div>
              )}
            </div>
          )}

          <section className="how-panel">
            <div>
              <h3><Info size={15} style={{ verticalAlign: '-2px', marginRight: 7, color: '#b66b52' }} />How the recommendations work</h3>
              <p>Choose a genre, mood, and the time you have. Books outside your time window are set aside; the rest earn points for matching your genre (+5) and mood (+4), then a small rating nudge breaks ties. With no clues selected, the catalogue stays in its original order. It is a transparent little ranking system—not a black box.</p>
            </div>
            <div className="logic-pills" aria-label="Recommendation score rules"><span className="logic-pill">Genre · +5</span><span className="logic-pill">Mood · +4</span><span className="logic-pill">Rating · tie-break</span></div>
          </section>
          <footer className="footer"><span>BETWEEN THE COVERS · A STUDENT READING GUIDE</span><span>Sixteen stories. Infinite places to begin.</span></footer>
        </div>
      </section>

      {selectedBook && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedBook(null); }}>
          <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="modal-book-title" data-testid="dialog-book-details">
            <button type="button" className="modal-close" aria-label="Close book details" onClick={() => setSelectedBook(null)} data-testid="button-close-details"><X size={17} /></button>
            <div className="modal-content">
              <div className="modal-cover"><img src={coverImage(selectedBook)} alt={`Illustrated cover for ${selectedBook.title}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
              <div className="modal-text">
                <span className="genre-tag">{selectedBook.genre}</span>
                <h2 id="modal-book-title">{selectedBook.title}</h2>
                <p className="author">by {selectedBook.author}</p>
                <p>{selectedBook.summary}</p>
                <div className="modal-meta"><span><Star size={11} fill="currentColor" style={{ verticalAlign: '-1px' }} /> {selectedBook.rating.toFixed(1)} reader rating</span><span><Clock3 size={11} style={{ verticalAlign: '-1px' }} /> {selectedBook.hours} hours</span>{selectedBook.moods.map((mood) => <span key={mood}>{mood}</span>)}</div>
                <button type="button" className="modal-fav" onClick={() => toggleFavorite(selectedBook.id)} data-testid="button-modal-save">
                  {savedIds.includes(selectedBook.id) ? <><Check size={14} style={{ verticalAlign: '-3px', marginRight: 5 }} />Saved to your shelf</> : <><Heart size={14} style={{ verticalAlign: '-3px', marginRight: 5 }} />Save this book</>}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
