import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth, useClerk, useUser } from '@clerk/react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetMyBookInteractionsQueryKey, getGetTrendingBooksQueryKey, useGetMyBookInteractions, useGetTrendingBooks, useRateBook, useRemoveBookFavorite, useSaveBookFavorite } from '@workspace/api-client-react';
import { ArrowDown, Bookmark, BookOpen, Check, Clock3, Heart, Info, Search, Sparkles, Star, TrendingUp, X } from 'lucide-react';
import { useLocation, Redirect } from 'wouter';
import { books, coverImage, type Book } from './books';

const genres = ['All genres', ...Array.from(new Set(books.map((book) => book.genre)))];
const STORAGE_KEY = 'book-guide-saved-v1';
const MERGE_KEY = 'book-guide-anonymous-merged-v1';
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function readSaved() {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch { return []; }
}

function BookCard({ book, saved, rating, onFavorite, onDetails, order }: {
  book: Book; saved: boolean; rating?: number; onFavorite: (id: string) => void; onDetails: (book: Book) => void; order: number;
}) {
  return (
    <article className="book-card" style={{ animationDelay: `${Math.min(order * 45, 360)}ms` }} data-testid={`card-book-${book.id}`}>
      <div className="cover-wrap" role="button" tabIndex={0} aria-label={`View details for ${book.title}`} onClick={() => onDetails(book)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDetails(book); } }}>
        <img src={coverImage(book)} alt={`Illustrated cover for ${book.title} by ${book.author}`} />
      </div>
      <div className="card-topline"><span className="genre-tag">{book.genre}</span><button className={`heart-btn ${saved ? 'is-favorite' : ''}`} type="button" onClick={() => onFavorite(book.id)} aria-label={saved ? `Remove ${book.title} from saved books` : `Save ${book.title}`} aria-pressed={saved} data-testid={`button-save-${book.id}`}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button></div>
      <h3>{book.title}</h3><p className="author">{book.author}</p><p className="summary">{book.summary}</p>
      <div className="card-meta"><span className="rating"><Star size={11} fill="currentColor" />{(rating ?? book.rating).toFixed(1)}</span><span><Clock3 size={11} />{book.hours} hr read</span><span>{book.moods[0]}</span></div>
      <div className="card-actions"><button type="button" className="details-btn" onClick={() => onDetails(book)} data-testid={`button-details-${book.id}`}>Book details</button></div>
    </article>
  );
}

function Skeletons() {
  return <div className="loading-grid" aria-label="Loading book recommendations" role="status">{[0, 1, 2, 3].map((item) => <div className="skeleton-card" key={item}><div className="skeleton-cover" /><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}</div>;
}

export default function BookGuide({ portal = false, redirectSignedIn = false }: { portal?: boolean; redirectSignedIn?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const client = useQueryClient();
  const trendingQuery = useGetTrendingBooks();
  const interactionsQuery = useGetMyBookInteractions({ query: { enabled: Boolean(isLoaded && isSignedIn), queryKey: getGetMyBookInteractionsQueryKey() } });
  const saveFavorite = useSaveBookFavorite();
  const removeFavorite = useRemoveBookFavorite();
  const rateBook = useRateBook();
  const [localSaved, setLocalSaved] = useState<string[]>(readSaved);
  const [view, setView] = useState<'discover' | 'trending' | 'saved'>('discover');
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('All genres');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [maxHours, setMaxHours] = useState('any');
  const [recommendationActive, setRecommendationActive] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [authPrompt, setAuthPrompt] = useState(false);
  const mergeStarted = useRef(false);
  const ids = interactionsQuery.data?.favorites ?? localSaved;
  const ratings = interactionsQuery.data?.ratings ?? [];
  const isBusy = saveFavorite.isPending || removeFavorite.isPending || rateBook.isPending;

  useEffect(() => { const timer = window.setTimeout(() => setLoading(false), 360); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { if (!isSignedIn) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(localSaved)); } catch { /* local shelf remains available in memory */ } } }, [localSaved, isSignedIn]);
  useEffect(() => {
    if (!isLoaded || !isSignedIn || mergeStarted.current || !interactionsQuery.data) return;
    const userKey = `${MERGE_KEY}:${user?.id ?? 'account'}`;
    try {
      if (localStorage.getItem(userKey)) return;
      const anonymous = readSaved().filter((id) => !interactionsQuery.data?.favorites.includes(id));
      mergeStarted.current = true;
      Promise.all(anonymous.map((bookId) => saveFavorite.mutateAsync({ bookId }))).then(() => {
        localStorage.setItem(userKey, 'done');
        localStorage.removeItem(STORAGE_KEY);
        if (anonymous.length) client.invalidateQueries({ queryKey: getGetMyBookInteractionsQueryKey() });
      }).catch(() => { mergeStarted.current = false; });
    } catch { /* storage may be unavailable; account interactions still work */ }
  }, [isLoaded, isSignedIn, interactionsQuery.data, saveFavorite, client, user?.id]);
  useEffect(() => {
    if (!selectedBook) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedBook(null); };
    window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close);
  }, [selectedBook]);

  if (redirectSignedIn && isLoaded && isSignedIn) return <Redirect to="/user-portal" />;
  if (portal && isLoaded && !isSignedIn) return <Redirect to="/" />;

  const updateFavorite = (id: string) => {
    setActionError('');
    if (!isSignedIn) { setAuthPrompt(true); return; }
    const mutation = ids.includes(id) ? removeFavorite : saveFavorite;
    mutation.mutate({ bookId: id }, {
      onSuccess: () => {
        client.invalidateQueries({ queryKey: getGetMyBookInteractionsQueryKey() });
        client.invalidateQueries({ queryKey: getGetTrendingBooksQueryKey() });
      },
      onError: () => setActionError('That change did not reach your shelf. Please try again.'),
    });
  };
  const submitRating = (id: string, value: number) => {
    setActionError('');
    if (!isSignedIn) { setAuthPrompt(true); return; }
    rateBook.mutate({ bookId: id, data: { rating: value } }, {
      onSuccess: () => {
        client.invalidateQueries({ queryKey: getGetMyBookInteractionsQueryKey() });
        client.invalidateQueries({ queryKey: getGetTrendingBooksQueryKey() });
      },
      onError: () => setActionError('Your rating could not be saved. Please try again.'),
    });
  };
  const personalRating = (id: string) => ratings.find((entry) => entry.bookId === id)?.rating;
  const savedBooks = useMemo(() => books.filter((book) => ids.includes(book.id)), [ids.join('|')]);
  const metrics = trendingQuery.data ?? [];
  const communityActive = metrics.some((metric) => metric.ratingCount > 0 || metric.favoriteCount > 0);
  const trendingBooks = useMemo(() => {
    const score = (book: Book) => {
      const metric = metrics.find((item) => item.bookId === book.id);
      if (!communityActive) return book.rating;
      if (!metric || (!metric.ratingCount && !metric.favoriteCount)) return 0;
      return Math.log1p(metric.favoriteCount * 2 + metric.ratingCount) + metric.averageRating / 10;
    };
    return [...books].sort((a, b) => score(b) - score(a));
  }, [metrics, communityActive]);
  const displayedBooks = useMemo(() => {
    let result = view === 'saved' ? savedBooks : view === 'trending' ? trendingBooks : books;
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
  }, [view, savedBooks, trendingBooks, search, genreFilter, recommendationActive, maxHours, selectedGenre, selectedMood]);
  const runRecommendation = () => { setRecommendationActive(true); setView('discover'); };
  const clearPreferences = () => { setRecommendationActive(false); setSelectedGenre(''); setSelectedMood(''); setMaxHours('any'); };
  const setShelf = (next: 'discover' | 'trending' | 'saved') => { setView(next); setSearch(''); };
  const selectedRatingMetric = selectedBook
    ? metrics.find((item) => item.bookId === selectedBook.id)
    : undefined;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="Between the Covers"><span className="brand-mark"><BookOpen size={19} /></span><span>between the covers</span></div>
        <nav className="nav-actions" aria-label="Main navigation">
          <button className={`nav-btn ${view === 'discover' ? 'active' : ''}`} onClick={() => setShelf('discover')} type="button">Discover</button>
          <button className={`nav-btn ${view === 'trending' ? 'active' : ''}`} onClick={() => setShelf('trending')} type="button"><TrendingUp size={13} /> Trending</button>
          <button className={`nav-btn ${view === 'saved' ? 'active' : ''}`} onClick={() => setShelf('saved')} type="button">Saved <span className="saved-count">{ids.length}</span></button>
          {isSignedIn ? <button className="nav-btn account-btn" type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })}>Sign out</button> : <button className="nav-btn account-btn" type="button" onClick={() => setLocation('/sign-in')}>Sign in</button>}
        </nav>
      </header>
      {portal && <div className="portal-ribbon">YOUR READING SPACE <span>Signed in · your shelf and ratings are synced</span></div>}
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow">Your next chapter starts here</div><h1>A book for<br />where you <em>are.</em></h1><p>For the curious, the tired, the wide-awake-at-midnight. Find a story that fits your interests, your time, and the way today feels.</p><div className="hero-stats"><div className="hero-stat"><strong>{books.length}</strong><span>handpicked reads</span></div><div className="hero-stat"><strong>2–13h</strong><span>from quick to epic</span></div><div className="hero-stat"><strong>8</strong><span>ways to feel</span></div></div></div>
        <div className="hero-art" aria-hidden="true"><div className="book-stack"><div className="sun-doodle" /><div className="book book-one"><div className="book-cover-copy"><span className="book-cover-title">A little<br />wonder</span><span className="book-cover-author">take the scenic way</span></div></div><div className="book book-two"><div className="book-cover-copy"><span className="book-cover-title">The<br />green<br />horizon</span><span className="book-cover-author">stories for the curious</span></div></div><div className="book book-three"><div className="book-cover-copy"><span className="book-cover-title">Somewhere<br />in between</span><span className="book-cover-author">a field guide to wonder</span></div></div><div className="orbit-note"><strong>Good stories</strong><br />meet you where you are.</div></div></div>
      </section>
      <section className="main-content" id="books"><div className="content-inner">
        <div className="section-heading"><div><h2>{view === 'trending' ? 'What readers are loving' : view === 'saved' ? 'Your saved shelf' : 'Find your kind of book'}</h2><p>{view === 'trending' ? (communityActive ? 'A living list shaped by reader ratings and favorites.' : 'A first look at the catalogue, ready for the community.') : view === 'saved' ? 'Keep the ones that caught your eye close by.' : 'Start with a feeling, a genre, or just follow a thread.'}</p></div>
          <div className="discover-tools"><label className="searchbox"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title, author, a word..." aria-label="Search by title, author, or description" data-testid="input-search-books" /></label>{view === 'discover' && <select className="filter-select" value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} aria-label="Filter by genre" data-testid="select-genre-filter">{genres.map((genre) => <option key={genre}>{genre}</option>)}</select>}</div>
        </div>
        {view === 'discover' && <section className="finder" aria-label="Personalized book finder"><div className="finder-intro"><span className="finder-icon"><Sparkles size={19} /></span><div><strong>Pick a reading mood</strong><span>A few clues make a good starting point.</span></div></div><div><span className="field-label">I feel like...</span><div className="choice-row">{['Fiction', 'Fantasy', 'Mystery', 'Nonfiction', 'Romance'].map((genre) => <button type="button" key={genre} className={`choice ${selectedGenre === genre ? 'selected' : ''}`} aria-pressed={selectedGenre === genre} onClick={() => setSelectedGenre(selectedGenre === genre ? '' : genre)}>{genre}</button>)}</div></div><div><span className="field-label">I want to feel...</span><div className="choice-row">{['Thoughtful', 'Hopeful', 'Adventurous', 'Motivated', 'Curious'].map((mood) => <button type="button" key={mood} className={`choice ${selectedMood === mood ? 'selected' : ''}`} aria-pressed={selectedMood === mood} onClick={() => setSelectedMood(selectedMood === mood ? '' : mood)}>{mood}</button>)}</div></div><div><label className="field-label" htmlFor="time-limit">Time I have</label><select id="time-limit" className="time-select" value={maxHours} onChange={(e) => setMaxHours(e.target.value)}><option value="any">Any reading time</option><option value="3">A couple of hours · up to 3h</option><option value="5">An afternoon · up to 5h</option><option value="8">A weekend · up to 8h</option><option value="12">Room for an epic · up to 12h</option></select><button type="button" className="recommend-btn" style={{ marginTop: 8, width: '100%' }} onClick={runRecommendation}>Find my books <ArrowDown size={13} /></button></div></section>}
        {recommendationActive && view === 'discover' && <p className="recommendation-note"><Sparkles size={13} /> {displayedBooks.length} matches, ranked by your clues and reader rating. <button type="button" className="nav-btn" onClick={clearPreferences}>Clear picks</button></p>}
        {actionError && <p className="action-error" role="alert">{actionError}</p>}
        {(trendingQuery.isError || (isSignedIn && interactionsQuery.isError)) && <div className="query-error" role="alert"><span>Some reader activity could not be loaded. The catalogue is still here.</span><button type="button" onClick={() => { void trendingQuery.refetch(); if (isSignedIn) void interactionsQuery.refetch(); }}>Try again</button></div>}
        {authPrompt && <div className="signin-nudge" role="status"><span><strong>Your shelf is yours to keep.</strong> Sign in to save books and rate your reads.</span><button className="details-btn" onClick={() => setLocation('/sign-in')} type="button">Sign in</button><button className="nudge-close" aria-label="Dismiss sign in message" onClick={() => setAuthPrompt(false)} type="button"><X size={15} /></button></div>}
        <div className="shelf-label">{view === 'trending' ? 'The community shelf' : recommendationActive ? 'Your reading shortlist' : view === 'saved' ? 'Saved for later' : 'A few good places to begin'}</div>
        {loading || (view === 'trending' && trendingQuery.isLoading) || (isSignedIn && interactionsQuery.isLoading) ? <Skeletons /> : displayedBooks.length ? <div className="book-grid" data-testid="grid-books">{displayedBooks.map((book, index) => {
          const metric = metrics.find((item) => item.bookId === book.id);
          return <BookCard key={book.id} book={book} saved={ids.includes(book.id)} rating={view === 'trending' && communityActive && metric?.ratingCount ? metric.averageRating : undefined} onFavorite={updateFavorite} onDetails={setSelectedBook} order={index} />;
        })}</div> : <div className="empty-state" role="status"><div className="empty-mark">{view === 'saved' ? <Bookmark size={20} /> : <Search size={20} />}</div><h3>{view === 'saved' ? 'Your shelf is ready.' : 'Nothing on this shelf.'}</h3><p>{view === 'saved' ? 'Save a book while browsing and it will find a home here.' : 'Try another search or choose a different genre.'}</p>{view === 'saved' && <button className="details-btn" onClick={() => setShelf('discover')} type="button">Browse the books</button>}</div>}
        <section className="how-panel"><div><h3><Info size={15} />How the recommendations work</h3><p>Choose a genre, mood, and the time you have. Books outside your time window are set aside; the rest earn points for matching your genre (+5) and mood (+4), then a small rating nudge breaks ties. The trending shelf uses community ratings and favorites when available, then falls back to catalogue scores.</p></div><div className="logic-pills"><span className="logic-pill">Genre · +5</span><span className="logic-pill">Mood · +4</span><span className="logic-pill">Reader activity</span></div></section>
        <footer className="footer"><span>BETWEEN THE COVERS · A STUDENT READING GUIDE</span><span>Sixteen stories. Infinite places to begin.</span></footer>
      </div></section>
      {selectedBook && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedBook(null); }}><section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="modal-book-title" data-testid="dialog-book-details"><button className="modal-close" aria-label="Close book details" onClick={() => setSelectedBook(null)} type="button"><X size={17} /></button><div className="modal-content"><div className="modal-cover"><img src={coverImage(selectedBook)} alt={`Illustrated cover for ${selectedBook.title}`} /></div><div className="modal-text"><span className="genre-tag">{selectedBook.genre}</span><h2 id="modal-book-title">{selectedBook.title}</h2><p className="author">by {selectedBook.author}</p><p>{selectedBook.summary}</p><div className="modal-meta"><span><Star size={11} fill="currentColor" /> {(selectedRatingMetric?.ratingCount ? selectedRatingMetric.averageRating : selectedBook.rating).toFixed(1)} {selectedRatingMetric?.ratingCount ? 'community rating' : 'catalogue score'}</span><span><Clock3 size={11} /> {selectedBook.hours} hours</span>{selectedBook.moods.map((mood) => <span key={mood}>{mood}</span>)}</div>
          <div className="rate-control"><span className="field-label">Your rating {personalRating(selectedBook.id) ? `· ${personalRating(selectedBook.id)} of 5` : ''}</span><div role="group" aria-label={`Rate ${selectedBook.title} from 1 to 5`} className="rating-stars">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" disabled={isBusy} aria-label={`Rate ${value} out of 5`} aria-pressed={personalRating(selectedBook.id) === value} onClick={() => submitRating(selectedBook.id, value)}><Star size={20} fill={(personalRating(selectedBook.id) ?? 0) >= value ? 'currentColor' : 'none'} /></button>)}</div>{!isSignedIn && <span className="rating-hint">Sign in to add your rating</span>}</div>
          <button type="button" className="modal-fav" disabled={isBusy} onClick={() => updateFavorite(selectedBook.id)}>{ids.includes(selectedBook.id) ? <><Check size={14} />Saved to your shelf</> : <><Heart size={14} />Save this book</>}</button></div></div></section></div>}
    </main>
  );
}
